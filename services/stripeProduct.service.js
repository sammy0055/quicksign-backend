const { stripeProduct } = require("../models/index.js");

class StripeProductService {
  static async createProduct(productData) {
    return await stripeProduct.create(productData);
  }

  static async findProducts() {
    return await stripeProduct.findAll();
  }

  static async findProduct(id) {
    return await stripeProduct.findOne({ where: { id } });
  }

  static async updateProduct(data) {
    const { productId, ...rest } = data;
    if (!productId) throw new Error("productId is required");
    await stripeProduct.update({ ...rest }, { where: { id: productId } });
  }

  static async removeProduct(productId) {
    if (!productId) throw new Error("productId is required");
    return await stripeProduct.destroy({ where: { id: productId } });
  }
}

module.exports = { StripeProductService };
