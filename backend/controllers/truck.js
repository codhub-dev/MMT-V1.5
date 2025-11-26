const { default: mongoose, get } = require('mongoose');
const Truck = require('../models/truck-model');
const FuelExpense = require('../models/fuelExpense-model');
const DefExpense = require('../models/defExpense-model');
const OtherExpense = require('../models/otherExpense-model');
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

const addTruck = async (req, res) => {
    try {
        const { addedBy, registrationNo, make, model, isFinanced, financeAmount, year, imgURL, chassisNo, engineNo, desc } = req.body;
        logger.info("Adding new truck", getFullContext(req, { addedBy, registrationNo, make, model, isFinanced }));

        const newTruck = new Truck({
            addedBy,
            registrationNo,
            make,
            model,
            year,
            isFinanced,
            financeAmount,
            imgURL,
            chassisNo,
            engineNo,
            desc,
        });

        const savedTruck = await newTruck.save();
        logger.info("Truck added successfully", { truckId: savedTruck._id, registrationNo: savedTruck.registrationNo });
        res.status(201).json(savedTruck);
    } catch (error) {
        logger.error('Error adding truck', { error: error.message, stack: error.stack });
        res.status(500).json({ message:'Failed to add truck', error: error.message });
    }
};

const getTruckById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info("Fetching truck by ID", { truckId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID provided", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        const truck = await Truck.findById(id);

        if (!truck) {
            logger.warn("Truck not found", { truckId: id });
            return res.status(404).json({ message: 'Truck not found' });
        }

        logger.info("Truck fetched successfully", { truckId: id, registrationNo: truck.registrationNo });
        res.status(200).json(truck);
    } catch (error) {
        logger.error('Error fetching truck by ID', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to fetch truck', error: error.message });
    }
};

const getAllTruckByUser = async (req, res) => {
    try {
        const { addedBy } = req.params;
        logger.info("Fetching all trucks by user", { userId: addedBy });

        const trucks = await Truck.find({ addedBy });

        if (trucks.length === 0) {
            logger.warn("No trucks found for user", { userId: addedBy });
            return res.status(404).json({ message: 'No trucks found for this user' });
        }

        logger.info("Trucks fetched successfully", { userId: addedBy, count: trucks.length });
        res.status(200).json(trucks);
    } catch (error) {
        logger.error('Error fetching trucks by user', { userId: req.params.addedBy, error: error.message });
        res.status(500).json({ message: 'Failed to fetch trucks', error: error.message });
    }
};

const updateTruckById = async (req, res) => {
    try {
        const { id } = req.params;
        const { registrationNo, make, model, year, imgURL, isFinanced, financeAmount, chassisNo, engineNo, desc } = req.body.values;
        logger.info("Updating truck", { truckId: id, registrationNo });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID for update", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        const updatedTruck = await Truck.findByIdAndUpdate(
            {_id:id},
            { registrationNo, make, model, year, isFinanced, financeAmount, imgURL, chassisNo, engineNo, desc },
            { new: true }
        );

        if (!updatedTruck) {
            logger.warn("Truck not found for update", { truckId: id });
            return res.status(404).json({ message: 'Truck not found' });
        }

        logger.info("Truck updated successfully", { truckId: id, registrationNo: updatedTruck.registrationNo });
        res.status(200).json(updatedTruck);
    } catch (error) {
        logger.error('Error updating truck', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to update truck', error: error.message });
    }
}

const getAllTrucks = async (req, res) => {
    try {
        logger.info("Fetching all trucks");
        const trucks = await Truck.find();

        logger.info("All trucks fetched successfully", { count: trucks.length });
        res.status(200).json(trucks);
    } catch (error) {
        logger.error('Error fetching all trucks', { error: error.message });
        res.status(500).json({ message: 'Failed to fetch trucks', error: error.message });
    }
};

const updateTruck = async (req, res) => {
    try {
        const { id } = req.params;
        const { registrationNo, make, model, year, imgURL, chassisNo, engineNo, desc } = req.body;
        logger.info("Updating truck (legacy endpoint)", { truckId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID for update", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        const updatedTruck = await Truck.findByIdAndUpdate(id, {
            registrationNo,
            make,
            model,
            year,
            imgURL,
            chassisNo,
            engineNo,
            desc,
        }, { new: true });

        logger.info("Truck updated successfully (legacy)", { truckId: id });
        res.status(200).json(updatedTruck);
    } catch (error) {
        logger.error('Error updating truck (legacy)', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to update truck', error: error.message });
    }
}

const deleteTruckById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info("Deleting truck and associated expenses", { truckId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID for deletion", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        await FuelExpense.deleteMany({ truckId: id });
        logger.info("Fuel expenses deleted", { truckId: id });

        await DefExpense.deleteMany({ truckId: id });
        logger.info("DEF expenses deleted", { truckId: id });

        await OtherExpense.deleteMany({ truckId: id });
        logger.info("Other expenses deleted", { truckId: id });

        const deletedTruck = await Truck.findByIdAndDelete(id);

        if (!deletedTruck) {
            logger.warn("Truck not found for deletion", { truckId: id });
            return res.status(404).json({ message: 'Truck not found' });
        }

        logger.info("Truck deleted successfully", { truckId: id, registrationNo: deletedTruck.registrationNo });
        res.status(200).json({ message: 'Truck and associated expenses deleted' });
    } catch (error) {
        logger.error('Error deleting truck', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to delete truck', error: error.message });
    }
};

module.exports = {
    addTruck,
    getTruckById,
    getAllTrucks,
    updateTruck,
    deleteTruckById,
    getAllTruckByUser,
    updateTruckById,
};
