const Address = require('../models/addressSchema');
const mongoose = require('mongoose');

class AddressController {
  // Create new address
  async create(req, res) {
    try {
      const {  is_default, address_line_1, city, zipcode, state } = req.body;
      const userId = req.user.id;

      // Validate user ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({
              success: false,
              message: 'Invalid user ID format'
          });
      }

      // If this is default address, unset any existing default
      if (is_default) {
        await Address.updateMany(
          { user: userId },
          { $set: { is_default: false } }
        );
      }

      const address = new Address({
        user: userId,
        is_default,
        address_line_1,
        city,
        zipcode,
        state
      });
      await address.save();

      const addresses = await Address.find({ user: userId }).sort({ is_default: -1 });

      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: addresses
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all addresses for a user
  async getByUser(req, res) {
    try {
        const user_id = req.user.id;
      
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const addresses = await Address.find({ user: user_id }).sort({ is_default: -1 });
      res.status(200).json({
        success: true,
        data: addresses
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single address
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID format'
        });
      }

      const address = await Address.findById(id);
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.status(200).json({
        success: true,
        data: address
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update address
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID format'
        });
      }

      // If setting as default, unset other defaults
      if (updates.is_default) {
        const address = await Address.findById(id);
        if (address) {
          await Address.updateMany(
            { user: address.user },
            { $set: { is_default: false } }
          );
        }
      }

      const address = await Address.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: address
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete address
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID format'
        });
      }

      const address = await Address.findByIdAndDelete(id);
      
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Set address as default
  async setDefault(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID format'
        });
      }

      const address = await Address.findById(id);
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // Unset any existing default addresses for this user
      await Address.updateMany(
        { user: address.user },
        { $set: { is_default: false } }
      );

      // Set the new default
      address.is_default = true;
      await address.save();

      res.status(200).json({
        success: true,
        message: 'Address set as default successfully',
        data: address
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AddressController();