class AlgoliaAutocompleteProducts {
  constructor(searchClient) {
    if (!searchClient) {
      throw new Error('Search client is required for AlgoliaAutocompleteProducts');
    }
    this.searchClient = searchClient;
  }

  getSource() {
    const { getAlgoliaResults } = window['@algolia/autocomplete-js'];
    
    if (!getAlgoliaResults) {
      throw new Error('getAlgoliaResults not found in autocomplete-js');
    }
    
    return {
      sourceId: 'products',
      getItems: ({ query }) => {
        if (!query) return [];
        
        return getAlgoliaResults({
          searchClient: this.searchClient,
          queries: [
            {
              indexName: 'shopify_products',
              query,
              params: {
                hitsPerPage: 6,
                attributesToRetrieve: [
                  'title',
                  'handle',
                  'product_type',
                  'variant_title',
                  'variants',
                  'image',
                  'price',
                  'compare_at_price',
                  'meta'
                ]
              }
            }
          ]
        });
      },
      templates: {
        item: this.getItemTemplate.bind(this),
        header: this.getHeaderTemplate.bind(this)
      },
      getItemUrl: this.getItemUrl.bind(this)
    };
  }

  getItemTemplate({ item, components, html }) {
    const fullTitle = item.meta?.ecomm_admin?.name || item.title;
    const productHandle = window.AlgoliaUtils?.processProductHandle(item) || item.handle;
    
    // Use setTimeout to check truncation after render
    setTimeout(() => this.addTooltipsToTruncatedTitles(), 0);
    
    return html`
      <div class="aa-ItemWrapper aa-ItemWrapper--products">
        <div class="aa-ItemContent">
          <a href="/products/${productHandle}?variant=${item.objectID}" class="aa-ItemLink">
            <div class="custom-item-image">
              ${item.image ? html`<img src="${item.image}" alt="${item.variant_title || item.title}" class="custom-item-img" />` : ''}
            </div>
            <div class="aa-ItemContentBody">
              <div class="aa-ItemContentTitle">${fullTitle}</div>
              <div class="aa-ItemContentDescription">
                ${item.variant_title ? html`<span class="aa-ItemVendor">${item.meta?.ecomm_admin?.part_number || item.variant_title}</span>` : ''}
              </div>
              <div class="aa-ItemContentPrice">
                ${item.price ? html`<span class="aa-ItemPrice">$${item.price.toFixed(2)}</span>` : ''}
              </div>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  addTooltipsToTruncatedTitles() {
    const titleElements = document.querySelectorAll('.aa-ItemContentTitle');
    
    titleElements.forEach((element) => {
      const scrollWidth = element.scrollWidth;
      const clientWidth = element.clientWidth;
      const text = element.textContent.trim();
      
      // Check if text is truncated by comparing scroll width vs client width
      if (scrollWidth > clientWidth) {
        // Add tooltip to entire card wrapper instead of just title
        const cardWrapper = element.closest('.aa-ItemWrapper--products');
        if (cardWrapper) {
          cardWrapper.setAttribute('title', text);
        }
      }
    });
  }

  getHeaderTemplate({ html }) {
    return html`
      <div class="aa-SourceHeader">
        <span class="aa-SourceHeaderTitle">Products</span>
      </div>
    `;
  }

  getItemUrl({ item }) {
    const productHandle = window.AlgoliaUtils?.processProductHandle(item) || item.handle;
    return `/products/${productHandle}`;
  }
}

window.AlgoliaAutocompleteProducts = AlgoliaAutocompleteProducts;
