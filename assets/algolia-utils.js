/**
 * Algolia utility functions shared across search components
 */
class AlgoliaUtils {
  /**
   * Process product handle for childproducts - removes -# suffix from handle
   * @param {Object} product - Product object with handle and product_type
   * @returns {string} - Processed handle
   */
  static processProductHandle(product) {
    if (!product || !product.handle) return '';
    
    let productHandle = product.handle;
    if (product.product_type === 'childproducts') {
      productHandle = product.handle.replace(/-\d+$/, '');
    }
    
    return productHandle;
  }
}

window.AlgoliaUtils = AlgoliaUtils;
