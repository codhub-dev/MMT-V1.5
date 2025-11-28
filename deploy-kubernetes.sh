#!/bin/bash

# ==============================================
# MMT Microservices - Kubernetes Deployment
# ==============================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    MMT Microservices - Kubernetes Deployment        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is installed${NC}"

# Check if a Kubernetes cluster is running
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}⚠  No Kubernetes cluster detected.${NC}"
    echo -e "${YELLOW}   Starting Minikube...${NC}"

    if ! command -v minikube &> /dev/null; then
        echo -e "${RED}✗ Minikube is not installed. Please install Minikube or configure a Kubernetes cluster.${NC}"
        exit 1
    fi

    minikube start --cpus=2 --memory=6144
    echo -e "${GREEN}✓ Minikube started${NC}"
fi

echo ""
echo -e "${BLUE}Deploying to Kubernetes...${NC}"
cd microservices/kubernetes

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f namespace.yaml

# Create secrets (if exists)
if [ -f "secrets/secrets.yaml" ]; then
    echo -e "${YELLOW}Creating secrets...${NC}"
    kubectl apply -f secrets/secrets.yaml
else
    echo -e "${YELLOW}⚠  secrets/secrets.yaml not found. Creating from example...${NC}"
    if [ -f "secrets/secrets.yaml.example" ]; then
        cp secrets/secrets.yaml.example secrets/secrets.yaml
        echo -e "${YELLOW}⚠  Please edit secrets/secrets.yaml with your actual secrets${NC}"
        kubectl apply -f secrets/secrets.yaml
    fi
fi

# Create config maps (if directory exists and has files)
if [ -d "configmaps" ] && [ "$(ls -A configmaps/*.yaml 2>/dev/null)" ]; then
    echo -e "${YELLOW}Creating config maps...${NC}"
    kubectl apply -f configmaps/
fi

# Deploy infrastructure first (MongoDB and RabbitMQ)
echo -e "${YELLOW}Deploying infrastructure (MongoDB & RabbitMQ)...${NC}"
kubectl apply -f deployments/infrastructure.yaml

# Wait for infrastructure to be ready
echo -e "${YELLOW}Waiting for infrastructure to be ready...${NC}"
kubectl wait --for=condition=available --timeout=120s deployment/mongodb deployment/rabbitmq -n mmt || true
sleep 10

# Deploy services
echo -e "${YELLOW}Deploying services...${NC}"
kubectl apply -f services/

# Deploy applications
echo -e "${YELLOW}Deploying applications...${NC}"
kubectl apply -f deployments/api-gateway-deployment.yaml

# Wait for deployments to be ready
echo ""
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment --all -n mmt

# Display deployment status
echo ""
echo -e "${BLUE}Deployment Status:${NC}"
kubectl get all -n mmt

# Get service URLs
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deployment Successful! 🎉                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if using Minikube
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo -e "${BLUE}Access URLs (Minikube):${NC}"
    echo -e "${YELLOW}Run these commands to access services:${NC}"
    echo -e "  ${GREEN}•${NC} API Gateway:    minikube service api-gateway -n mmt"
    echo -e "  ${GREEN}•${NC} Auth Service:   minikube service auth-service -n mmt"
    echo -e "  ${GREEN}•${NC} Fleet Service:  minikube service fleet-service -n mmt"
    echo ""
    echo -e "${YELLOW}Or use port-forwarding:${NC}"
    echo -e "  kubectl port-forward -n mmt service/api-gateway 5001:3000"
else
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Use 'kubectl get services -n mmt' to see service endpoints"
    echo ""
    echo -e "${YELLOW}Port-forwarding example:${NC}"
    echo -e "  kubectl port-forward -n mmt service/api-gateway 5001:3000"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  ${GREEN}•${NC} View pods:    kubectl get pods -n mmt"
echo -e "  ${GREEN}•${NC} View logs:    kubectl logs -f <pod-name> -n mmt"
echo -e "  ${GREEN}•${NC} Describe pod: kubectl describe pod <pod-name> -n mmt"
echo -e "  ${GREEN}•${NC} Delete all:   kubectl delete namespace mmt"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Set up port-forwarding or use Minikube service URLs"
echo -e "  2. Start the frontend: cd frontend && npm install && npm start"
echo -e "  3. Access the application at http://localhost:3000"
echo ""
