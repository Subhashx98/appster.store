class AlgoliaSearchResults {
  constructor() {
    this.allPossibleFacets = [];
    this.currentPage = 0;
    this.hitsPerPage = 24;
    this.totalPages = 0;
    this.totalHits = 0;
    
    // Initialize pagination
    this.pagination = new SearchPagination({
      hitsPerPage: this.hitsPerPage,
      maxVisiblePages: 5,
      containerSelector: '#search-pagination-container'
    });
    
    this.loadFacetList().then(() => {
      this.waitForLibraries().then(() => {
        this.initSearchResults();
      }).catch(error => {
        console.error('Failed to initialize Algolia search results:', error);
      });
    });
  }

  async loadFacetList() {
    try {
      const facetListUrl = window.ALGOLIA_FACET_LIST_URL || '/assets/algolia-facet-list.json';
      const response = await fetch(facetListUrl);
      this.allPossibleFacets = await response.json();
    } catch (error) {
      console.error('Failed to load facet list:', error);
      // Fallback to empty array
      this.allPossibleFacets = [];
    }
  }

  async waitForLibraries(timeoutMs = 5000) {
    const start = Date.now();
    while (!window.algoliasearch) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Algolia libraries failed to load within timeout.');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  initSearchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    const page = SearchPagination.getCurrentPageFromUrl();
    
    this.currentPage = page - 1; // Convert to 0-based for Algolia
    
    if (!query) {
      this.showNoQuery();
      return;
    }

     // Initialize Algolia client
    const { algoliasearch } = window.algoliasearch;
    this.searchClient = algoliasearch('GC3UDVL5DJ', '5b48556ccc38f74ea56d1fb1725dc6ea');

    this.updatePageInfo(query);

    // Get facet selections
    const selectedFacets = this.getSelectedFacetsFromUrl(urlParams);

    this.performSearch(query, selectedFacets);
  }

  getSelectedFacetsFromUrl(urlParams) {
    const selectedFacets = {};
    this.allPossibleFacets.forEach(facetName => {
      const facetValue = urlParams.get(facetName);
      if (facetValue) {
        selectedFacets[facetName] = facetValue.split(',').map(value => decodeURIComponent(value));
      }
    });
    return selectedFacets;
  }

  updatePageInfo(query) {
    // Update page heading
    const heading = document.querySelector('.search-results-heading');
    if (heading) {
      heading.textContent = `Search results for "${query}"`;
    }

    // Update page title
    document.title = `Search: ${query} - ${document.title.split(' - ').pop()}`;
  }

  async performSearch(query, selectedFacets = {}) {
    const resultsContainer = document.querySelector('#search-results-container');
    const loadingContainer = document.querySelector('#search-loading');
    
    if (loadingContainer) {
      loadingContainer.style.display = 'block';
    }

    // Build facet filters
    const facetFilters = this.buildFacetFilters(selectedFacets);

    try {
      const searchParams = {
        query: query,
        hitsPerPage: this.hitsPerPage,
        page: this.currentPage,
        attributesToRetrieve: [
          'title',
          'variant_title',
          'handle',
          'product_type',
          'vendor',
          'variants',
          'image',
          'price',
          'compare_at_price',
          'body_html_safe',
          'tags',
          'options'
        ],
        facets: this.allPossibleFacets,
        maxValuesPerFacet: 20
      };

      if (facetFilters.length > 0) {
        searchParams.facetFilters = facetFilters;
      }

      const response = await this.searchClient.searchSingleIndex({
        indexName: 'shopify_products',
        searchParams: searchParams
      });

      if (loadingContainer) {
        loadingContainer.style.display = 'none';
      }

      this.totalHits = response.nbHits;
      this.totalPages = response.nbPages;

      // Update pagination with new data
      this.pagination.update(this.currentPage + 1, this.totalPages, this.totalHits);

      this.displayResults(response.hits, response.nbHits, query);
      this.displayFacets(response.facets || {}, query);
      this.displayPagination(query, selectedFacets);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showError();
    }
  }

  buildFacetFilters(selectedFacets) {
    const facetFilters = [];
    Object.keys(selectedFacets).forEach(facetName => {
      const values = selectedFacets[facetName];
      if (values && values.length > 0) {
        facetFilters.push(values.map(value => `${facetName}:${value}`));
      }
    });
    return facetFilters;
  }

  displayFacets(facets, currentQuery) {
    const facetsContainer = document.querySelector('#search-facets-container');
    if (!facetsContainer) {
      console.log('Facets container #search-facets-container not found');
      return;
    }
    
    // Handle completely missing facets
    if (!facets || typeof facets !== 'object') {
      facetsContainer.innerHTML = '<div class="no-facets"><p>No filters available</p></div>';
      return;
    }

    const availableFacets = Object.keys(facets).filter(key => 
      facets[key] && Object.keys(facets[key]).length > 0
    );

    if (availableFacets.length === 0) {
      console.log('No facets with values found');
      facetsContainer.innerHTML = '<div class="no-facets"><p>No filters available for this search</p></div>';
      return;
    }

    let facetsHTML = '<div class="search-facets">';
    
    // Only loop through facets that actually have values
    availableFacets.forEach(facetName => {
      const facetValues = facets[facetName];
      const facetCount = Object.keys(facetValues).length;
      
      if (facetCount > 0) {
        facetsHTML += `
          <details class="facets__disclosure-vertical js-filter" data-index="${availableFacets.indexOf(facetName) + 1}" ${facetName === 'product_type' ? 'open' : ''}>
            <summary class="facets__summary caption-large focus-offset">
              <div>
                <span class="facets__summary-label">${this.formatFacetName(facetName)}</span>
                <span class="plus-minus-icon"></span>
              </div>
            </summary>
            <div class="facets__display-vertical">
              <fieldset class="facets-wrap parent-wrap facets-wrap-vertical">
                <legend class="visually-hidden">${this.formatFacetName(facetName)}</legend>
                <ul class="facets-layout facets-layout-list facets-layout-list--text facets__list--vertical list-unstyled" role="list">
        `;
        
        // Sort facet values by count (descending)
        const sortedValues = Object.entries(facetValues)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10); // Show top 10 values
        
        sortedValues.forEach(([value, count]) => {
          // Skip empty values
          if (!value || value.trim() === '') return;
          
          const isSelected = this.isFacetSelected(facetName, value);
          const escapedValue = this.escapeHtml(value);
          const inputId = `Filter-${facetName}-${facetValues[value]}`;

          facetsHTML += `
            <li class="list-menu__item facets__item">
              <label for="${inputId}" class="facets__label facet-checkbox${isSelected ? ' active' : ''}">
                <input 
                  type="checkbox" 
                  name="${facetName}"
                  value="${escapedValue}"
                  id="${inputId}"
                  data-facet="${this.escapeHtml(facetName)}" 
                  data-value="${escapedValue}"
                  ${isSelected ? 'checked' : ''}
                >
                <svg class="icon icon-checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="16" height="16" stroke="currentColor" fill="none" rx="2"/>
                </svg>
                <div class="svg-wrapper">
                  <svg class="icon icon-checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.67 8L6 11.33L13.33 4" stroke="currentColor" stroke-width="2" fill="none"/>
                  </svg>
                </div>
                <span class="facet-checkbox__text" aria-hidden="true">
                  <span class="facet-checkbox__text-label">${escapedValue}</span>
                  <span class="facet-checkbox__text-count">(${count})</span>
                </span>
                <span class="visually-hidden">${escapedValue} (${count} products)</span>
              </label>
            </li>
          `;
        });
        
        facetsHTML += `
                </ul>
              </fieldset>
            </div>
          </details>
        `;
      }
    });
    
    facetsContainer.innerHTML = facetsHTML;
    
    // Add event listeners for facet filtering
    this.addFacetListeners();
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Helper method to format facet names
  formatFacetName(facetName) {
    const strippedName = facetName.replace("options.","").replaceAll("_", " ");
    const titleCasedName = strippedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return titleCasedName;
  }

  // Check if a facet is currently selected
  isFacetSelected(facetName, value) {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedFacets = urlParams.get(facetName);
    if (!selectedFacets) return false;
    
    // Decode both the URL values and the comparison value
    const decodedUrlValues = selectedFacets.split(',').map(v => decodeURIComponent(v));
    const decodedValue = decodeURIComponent(value);
    
    return decodedUrlValues.includes(value) || decodedUrlValues.includes(decodedValue);
  }

  // Add event listeners for facet filtering
  addFacetListeners() {
    const facetInputs = document.querySelectorAll('.facets__item input[type="checkbox"]');
    
    facetInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.handleFacetChange();
      });
    });
  }

  // Handle facet selection changes
  handleFacetChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedFacets = {};
    
    // Collect all selected facets
    document.querySelectorAll('.facets__item input[type="checkbox"]:checked').forEach(input => {
      const facetName = input.dataset.facet;
      const value = input.dataset.value;
      
      if (!selectedFacets[facetName]) {
        selectedFacets[facetName] = [];
      }
      selectedFacets[facetName].push(value);
    });
    
    // Reset to page 1 when filters change
    this.currentPage = 0;
    urlParams.delete('page');
    
    // Update URL parameters
    this.updateUrlWithFacets(urlParams, selectedFacets);
    
    const query = urlParams.get('q') || '';
    this.performSearch(query, selectedFacets);
  }

  updateUrlWithFacets(urlParams, selectedFacets) {
    Object.keys(selectedFacets).forEach(facetName => {
      if (selectedFacets[facetName].length > 0) {
        const encodedValues = selectedFacets[facetName].map(value => encodeURIComponent(value));
        urlParams.set(facetName, encodedValues.join(','));
      } else {
        urlParams.delete(facetName);
      }
    });
    
    this.allPossibleFacets.forEach(facetName => {
      if (!selectedFacets[facetName] || selectedFacets[facetName].length === 0) {
        urlParams.delete(facetName);
      }
    });
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  }

  displayPagination(query, selectedFacets = {}) {
    this.pagination.render(query, selectedFacets);
    this.pagination.scrollToResults();
  }

  displayResults(hits, totalResults, query) {
    const resultsContainer = document.querySelector('#search-results-container');
    const resultsCount = document.querySelector('#search-results-count');
    
    if (resultsCount) {
      resultsCount.textContent = this.pagination.buildResultsInfo();
    }

    if (hits.length === 0) {
      this.showNoResults(query);
      return;
    }

    const resultsHTML = hits.map(hit => this.createProductHTML(hit)).join('');
    resultsContainer.innerHTML = `
      <ul class="grid product-grid grid--2-col-tablet-down grid--3-col-desktop" role="list">
        ${resultsHTML}
      </ul>
    `;
  }

  createProductHTML(product) {
    const price = product.variants && product.variants.length > 0 ? product.variants[0].price : product.price;
    const comparePrice = product.variants && product.variants.length > 0 ? product.variants[0].compare_at_price : product.compare_at_price;
    
    // Handle childproducts - use centralized utility
    const productHandle = window.AlgoliaUtils?.processProductHandle(product) || product.handle;
    
    // Generate responsive image HTML
    const generateImageHTML = (imageUrl, altText) => {
      if (!imageUrl) return '';
      
      // Extract base URL without parameters
      const baseUrl = imageUrl.split('?')[0];
      const urlParams = new URLSearchParams(imageUrl.split('?')[1] || '');
      const version = urlParams.get('v') || '';
      
      // Generate srcset with different widths
      const widths = [165, 360, 533, 720, 940, 1066];
      const srcsetEntries = widths.map(width => 
        `${baseUrl}?v=${version}&width=${width} ${width}w`
      );
      
      // Add the original image as the largest size
      srcsetEntries.push(`${baseUrl}?v=${version} 1500w`);
      
      const srcset = srcsetEntries.join(',');
      const src = `${baseUrl}?v=${version}&width=533`;
      const sizes = "(min-width: 1620px) 372px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";
      
      return `<img 
        srcset="${srcset}" 
        src="${src}" 
        sizes="${sizes}" 
        alt="${altText}" 
        class="motion-reduce" 
        width="1500" 
        height="1500" 
        loading="lazy">`;
    };
    
return `
      <li class="grid__item scroll-trigger animate--slide-in" data-cascade="">
        <div class="card-wrapper product-card-wrapper underline-links-hover">
          <div class="card card--standard card--media" style="--ratio-percent: 100%;">
            <div class="selling-tag-option"></div>
            <div class="card__inner color-scheme-2 gradient">
              <div class="card__media">
                <div class="media media--transparent media--hover-effect">
                  ${product.image ? generateImageHTML(product.image, product.title) : ''}
                </div>
              </div>
          </div>
          <div class="card__content">
            <div class="card__information">
              <div class="card_box">
                <h3 id="title--${product.objectID}" class="card__heading h5">
                  <a  
                    id="CardLink--${product.objectID}" 
                    class="full-unstyled-link" 
                    aria-labelledby="CardLink--${product.objectID}" 
                    href="/products/${productHandle}?variant=${product.objectID}">
                      ${this.highlightText(product.title)}
                  </a>
                </h3>
                <span class="sub-heading">
                  ${product.variant_title}
                </span>
              </div>
              <div class="card-information">
                <span class="caption-large light"></span>
                <div class="price">
                  <div class="price__container">
                    <div class="price__regular">
                      <span calss="visually-hidden visually-hidden--inline"></span>
                      <span class="price-item price-item--regular">$${(price).toFixed(2)}</span>
                    </div>
                    <div class="price__sale">
                      <span class="visually-hidden visually-hidden--inline">Regular price</span>
                      <span><s class="price-item price-item--regular"></s></span>
                      <span class="visually-hidden visually-hidden--inline">Sale price</span>
                      <span class="price-item price-item--sale price-item--last"></span>
                    </div>
                    <small class="unit-price caption hidden">
                      <span class="visually-hidden">Unit price</span>
                      <span class="price-item price-item--last">
                        <span></span>
                        <span aria-hidden="true">/</span>
                        <span class="visually-hidden">&nbsp;per&nbsp;</span>
                        <span></span>
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div class="card__badge bottom left"></div>
          </div>
          <div class="quantity-add-cart">
            <form id="quantity-cart" class="quantity-form" name="customAddToCart" method="post">
              <input type="hidden" name="form_type" value="product">
              <input type="hidden" name="utf8" value="✓">
              <input type="hidden" name="id" value="${product.objectID}">
              <input type="hidden" name="quantity" min="1" value="1">
              <input type="hidden" class="product-variant-id" name="product_id" value="${product.objectID}">
              ${ product._highlightResult.sku.value ? `<input type="hidden" class="product-variant-part-number" name="properties[Part Number]" value="${product._highlightResult.sku.value.replace(/<\/?em>/g, '')}">` : `` }
              <div class="quantity quantity_block" product-id="${product.objectID}">
                <button id="decrease-qty" class="quantity__button decrease-qty" name="minus" type="button">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 11.0002C17.5 11.2918 17.4062 11.5314 17.2188 11.7189C17.0312 11.9064 16.7917 12.0002 16.5 12.0002H12H11.5C11 12.0002 11.5 12.0002 11 12.0002C10.5 12.0002 10.7917 12.0002 10.5 12.0002C11 12.0002 10.2083 12.0002 10.5 12.0002C10 12.0002 10.3125 11.8127 10.5 12.0002H10H5.5C5.20833 12.0002 4.96875 11.9064 4.78125 11.7189C4.59375 11.5314 4.5 11.2918 4.5 11.0002C4.5 10.7085 4.59375 10.4689 4.78125 10.2814C4.96875 10.0939 5.20833 10.0002 5.5 10.0002H10L10.5 10.0001C11 10.0001 10.7083 10 11 10C11.2917 10 11 10.0001 11.5 10.0002C12 9.99992 12 10.0002 12 10.0002H16.5C16.7917 10.0002 17.0312 10.0939 17.2188 10.2814C17.4062 10.4689 17.5 10.7085 17.5 11.0002Z" fill="black"></path>
                  </svg>
                </button>
                <input 
                  class="quantity__input" 
                  type="number" 
                  name="quantity" 
                  value="1" 
                  data-cart-quantity="0" 
                  min="1" 
                  step="1">
                <button class="quantity__button increase-qty" name="plus" type="button" id="increase-qty">
                  <span class="svg-wrapper">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 11C17.5 11.2917 17.4062 11.5312 17.2188 11.7188C17.0312 11.9062 16.7917 12 16.5 12H12V16.5C12 16.7917 11.9062 17.0312 11.7188 17.2188C11.5312 17.4062 11.2917 17.5 11 17.5C10.7083 17.5 10.4688 17.4062 10.2812 17.2188C10.0938 17.0312 10 16.7917 10 16.5V12H5.5C5.20833 12 4.96875 11.9062 4.78125 11.7188C4.59375 11.5312 4.5 11.2917 4.5 11C4.5 10.7083 4.59375 10.4688 4.78125 10.2812C4.96875 10.0938 5.20833 10 5.5 10H10V5.5C10 5.20833 10.0938 4.96875 10.2812 4.78125C10.4688 4.59375 10.7083 4.5 11 4.5C11.2917 4.5 11.5312 4.59375 11.7188 4.78125C11.9062 4.96875 12 5.20833 12 5.5V10H16.5C16.7917 10 17.0312 10.0938 17.2188 10.2812C17.4062 10.4688 17.5 10.7083 17.5 11Z" fill="black"></path>
                    </svg>
                  </span>
                </button>
              </div>
              <button id="product_submit" class="main-btn-small btn-blue" type="submit" name="add">
                <span>Add to Cart</span>
                <div class="loading__spinner hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" class="spinner" viewBox="0 0 66 66">
                  <circle stroke-width="6" cx="33" cy="33" r="30" fill="none" class="path"></circle></svg>
                </div>
              </button>
            </form>
          </div>
        </div>
      </li>
    `;
  }

  highlightText(text) {
    // Simple highlighting - you can make this more sophisticated
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  showNoQuery() {
    const resultsContainer = document.querySelector('#search-results-container');
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h2>Search our products</h2>
        <p>Enter a search term to find products.</p>
      </div>
    `;
  }

  showNoResults(query) {
    const resultsContainer = document.querySelector('#search-results-container');
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h2>No results found for "${query}"</h2>
        <p>Try adjusting your search terms or browse our categories.</p>
      </div>
    `;
  }

  showError() {
    const resultsContainer = document.querySelector('#search-results-container');
    resultsContainer.innerHTML = `
      <div class="search-error">
        <h2>Search temporarily unavailable</h2>
        <p>Please try again in a moment.</p>
      </div>
    `;
  }
}

// Initialize when DOM is loaded and we're on the search page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/search') {
    new AlgoliaSearchResults();
  }
});
