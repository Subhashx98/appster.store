class SearchPagination {
  constructor(options = {}) {
    this.currentPage = options.currentPage || 1;
    this.totalPages = options.totalPages || 1;
    this.totalHits = options.totalHits || 0;
    this.hitsPerPage = options.hitsPerPage || 20;
    this.maxVisiblePages = options.maxVisiblePages || 5;
    this.containerSelector = options.containerSelector || '#search-pagination-container';
  }

  update(currentPage, totalPages, totalHits) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.totalHits = totalHits;
  }

  render(query, selectedFacets = {}) {
    const container = document.querySelector(this.containerSelector);
    if (!container || this.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    const paginationHTML = this.buildPaginationHTML(query, selectedFacets);
    container.innerHTML = paginationHTML;
  }

  buildPaginationHTML(query, selectedFacets) {
    const resultsInfo = this.buildResultsInfo();
    const navigation = this.buildNavigation(query, selectedFacets);
    
    return `
      <div class="pagination-wrapper">
        <p>${resultsInfo}</p>
        ${navigation}
      </div>
    `;
  }

  buildResultsInfo() {
    const startResult = (this.currentPage - 1) * this.hitsPerPage + 1;
    const endResult = Math.min(this.currentPage * this.hitsPerPage, this.totalHits);
    return `Showing ${startResult}-${endResult} of ${this.totalHits} results`;
  }

  buildNavigation(query, selectedFacets) {
    const { startPage, endPage } = this.calculatePageRange();
    
    let navigationHTML = '<nav class="pagination" role="navigation" aria-label="Pagination">';
    navigationHTML += '<ul class="pagination__list list-unstyled" role="list">';
    
    // Previous button
    navigationHTML += this.buildPreviousButton(query, selectedFacets);
    
    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      navigationHTML += this.buildPageButton(page, query, selectedFacets);
    }
    
    // Next button
    navigationHTML += this.buildNextButton(query, selectedFacets);
    
    navigationHTML += '</ul>';
    navigationHTML += '</nav>';
    
    return navigationHTML;
  }

  calculatePageRange() {
    let startPage = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + this.maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < this.maxVisiblePages) {
      startPage = Math.max(1, endPage - this.maxVisiblePages + 1);
    }
    
    return { startPage, endPage };
  }

  buildPreviousButton(query, selectedFacets) {
    if (this.currentPage <= 1) return '';

    return `
      <li>
        <a href="${this.buildUrl(this.currentPage - 1, query, selectedFacets)}" 
         class="pagination__item pagination__item--next pagination__item-arrow link motion-reduce" 
         aria-label="Previous page">
          <span class="svg-wrapper">
            <svg class="icon icon-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path fill="currentColor" fill-rule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clip-rule="evenodd"></path>
            </svg>
          </span>
        </a>
      </li>
    `;
  }

  buildNextButton(query, selectedFacets) {
    if (this.currentPage >= this.totalPages) return '';
    
    return `
      <li>
        <a href="${this.buildUrl(this.currentPage + 1, query, selectedFacets)}" 
         class="pagination__item pagination__item--prev pagination__item-arrow link motion-reduce" 
         aria-label="Next page">
          <span class="svg-wrapper">
            <svg class="icon icon-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path fill="currentColor" fill-rule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clip-rule="evenodd"></path>
            </svg>
          </span>
        </a>
      </li>
    `;
  }

  buildPageButton(page, query, selectedFacets) {
    if (page === this.currentPage) {
      return `
        <li>
          <a class="pagination__item pagination__item--current" 
                aria-current="page" 
                aria-disabled="true" 
                aria-label="Page ${page}">
            ${page}
          </a>
        </li>
      `;
    }
    
    return `
      <li>
        <a href="${this.buildUrl(page, query, selectedFacets)}" 
          class="pagination__item link" 
          aria-label="Page ${page}">
            ${page}
        </a>
      </li>
    `;
  }

  buildUrl(page, query, selectedFacets = {}) {
    const urlParams = new URLSearchParams();
    urlParams.set('q', query);
    
    if (page > 1) {
      urlParams.set('page', page.toString());
    }
    
    // Add selected facets to URL
    Object.keys(selectedFacets).forEach(facetName => {
      if (selectedFacets[facetName] && selectedFacets[facetName].length > 0) {
        urlParams.set(facetName, selectedFacets[facetName].join(','));
      }
    });
    
    return `${window.location.pathname}?${urlParams.toString()}`;
  }

  // Utility method to get current page from URL
  static getCurrentPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('page')) || 1;
  }

  // Utility method to scroll to results
  scrollToResults(selector = '#search-results-container') {
    const container = document.querySelector(selector);
    if (container && this.currentPage > 1) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
