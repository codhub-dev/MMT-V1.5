const mongoose = require('mongoose');
const Truck = require('../models/truck-model');
const FuelExpense = require('../models/fuelExpense-model');
const DefExpense = require('../models/defExpense-model');
const OtherExpense = require('../models/otherExpense-model');

const truckResolvers = {
  Query: {
    /**
     * Get a truck by its ID
     */
    getTruckById: async (_, { id }) => {
      try {
        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('Invalid truck ID');
        }

        // Find the truck by ID
        const truck = await Truck.findById(id);

        if (!truck) {
          throw new Error('Truck not found');
        }

        return {
          message: 'Truck retrieved successfully',
          truck: {
            id: truck._id.toString(),
            addedBy: truck.addedBy,
            registrationNo: truck.registrationNo,
            createdAt: truck.createdAt ? truck.createdAt.toISOString() : null,
            isFinanced: truck.isFinanced,
            financeAmount: truck.financeAmount,
            make: truck.make,
            model: truck.model,
            year: truck.year,
            imgURL: truck.imgURL,
            chassisNo: truck.chassisNo,
            engineNo: truck.engineNo,
            desc: truck.desc,
          },
        };
      } catch (error) {
        throw new Error(`Failed to fetch truck: ${error.message}`);
      }
    },

    /**
     * Get all trucks in the system
     */
    getAllTrucks: async () => {
      try {
        const trucks = await Truck.find();

        return {
          message: 'Trucks retrieved successfully',
          trucks: trucks.map((truck) => ({
            id: truck._id.toString(),
            addedBy: truck.addedBy,
            registrationNo: truck.registrationNo,
            createdAt: truck.createdAt ? truck.createdAt.toISOString() : null,
            isFinanced: truck.isFinanced,
            financeAmount: truck.financeAmount,
            make: truck.make,
            model: truck.model,
            year: truck.year,
            imgURL: truck.imgURL,
            chassisNo: truck.chassisNo,
            engineNo: truck.engineNo,
            desc: truck.desc,
          })),
        };
      } catch (error) {
        throw new Error(`Failed to fetch trucks: ${error.message}`);
      }
    },

    /**
     * Get all trucks added by a specific user
     */
    getAllTrucksByUser: async (_, { addedBy }) => {
      try {
        const trucks = await Truck.find({ addedBy });

        if (trucks.length === 0) {
          return {
            message: 'No trucks found for this user',
            trucks: [],
          };
        }

        return {
          message: 'Trucks retrieved successfully',
          trucks: trucks.map((truck) => ({
            id: truck._id.toString(),
            addedBy: truck.addedBy,
            registrationNo: truck.registrationNo,
            createdAt: truck.createdAt ? truck.createdAt.toISOString() : null,
            isFinanced: truck.isFinanced,
            financeAmount: truck.financeAmount,
            make: truck.make,
            model: truck.model,
            year: truck.year,
            imgURL: truck.imgURL,
            chassisNo: truck.chassisNo,
            engineNo: truck.engineNo,
            desc: truck.desc,
          })),
        };
      } catch (error) {
        throw new Error(`Failed to fetch trucks by user: ${error.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Add a new truck to the system
     */
    addTruck: async (_, { input }) => {
      try {
        const {
          addedBy,
          registrationNo,
          make,
          model,
          isFinanced,
          financeAmount,
          year,
          imgURL,
          chassisNo,
          engineNo,
          desc,
        } = input;

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

        return {
          message: 'Truck added successfully',
          truck: {
            id: savedTruck._id.toString(),
            addedBy: savedTruck.addedBy,
            registrationNo: savedTruck.registrationNo,
            createdAt: savedTruck.createdAt
              ? savedTruck.createdAt.toISOString()
              : null,
            isFinanced: savedTruck.isFinanced,
            financeAmount: savedTruck.financeAmount,
            make: savedTruck.make,
            model: savedTruck.model,
            year: savedTruck.year,
            imgURL: savedTruck.imgURL,
            chassisNo: savedTruck.chassisNo,
            engineNo: savedTruck.engineNo,
            desc: savedTruck.desc,
          },
        };
      } catch (error) {
        throw new Error(`Failed to add truck: ${error.message}`);
      }
    },

    /**
     * Update an existing truck by ID
     */
    updateTruckById: async (_, { id, input }) => {
      try {
        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('Invalid truck ID');
        }

        const {
          registrationNo,
          make,
          model,
          year,
          imgURL,
          isFinanced,
          financeAmount,
          chassisNo,
          engineNo,
          desc,
        } = input;

        // Update the truck with the provided fields
        const updatedTruck = await Truck.findByIdAndUpdate(
          { _id: id },
          {
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
          },
          { new: true }
        );

        if (!updatedTruck) {
          throw new Error('Truck not found');
        }

        return {
          message: 'Truck updated successfully',
          truck: {
            id: updatedTruck._id.toString(),
            addedBy: updatedTruck.addedBy,
            registrationNo: updatedTruck.registrationNo,
            createdAt: updatedTruck.createdAt
              ? updatedTruck.createdAt.toISOString()
              : null,
            isFinanced: updatedTruck.isFinanced,
            financeAmount: updatedTruck.financeAmount,
            make: updatedTruck.make,
            model: updatedTruck.model,
            year: updatedTruck.year,
            imgURL: updatedTruck.imgURL,
            chassisNo: updatedTruck.chassisNo,
            engineNo: updatedTruck.engineNo,
            desc: updatedTruck.desc,
          },
        };
      } catch (error) {
        throw new Error(`Failed to update truck: ${error.message}`);
      }
    },

    /**
     * Delete a truck and all its associated expenses
     */
    deleteTruckById: async (_, { id }) => {
      try {
        // Validate the truck ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('Invalid truck ID');
        }

        // Delete associated fuel expenses
        await FuelExpense.deleteMany({ truckId: id });

        // Delete associated DefExpenses
        await DefExpense.deleteMany({ truckId: id });

        // Delete associated other expenses
        await OtherExpense.deleteMany({ truckId: id });

        // Delete the truck
        const deletedTruck = await Truck.findByIdAndDelete(id);

        if (!deletedTruck) {
          throw new Error('Truck not found');
        }

        return {
          message: 'Truck and associated expenses deleted successfully',
          success: true,
        };
      } catch (error) {
        throw new Error(`Failed to delete truck: ${error.message}`);
      }
    },
  },
};

module.exports = truckResolvers;
