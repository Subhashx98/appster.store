class AlgoliaAutocomplete {
  constructor() {
    this.searchClient = null;
    this.productsModule = null;
    this.articlesModule = null;

    this.waitForLibraries().then(() => {
      this.waitForContainer().then(() => {
        this.initAlgolia();
      });
    }).catch(error => {
      console.error('Failed to initialize Algolia:', error);
    });
  }

  async waitForLibraries(timeoutMs = 5000) {
    const start = Date.now();
    while (!window.algoliasearch || !window['@algolia/autocomplete-js']) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Algolia libraries failed to load within timeout.');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async waitForContainer(timeoutMs = 5000) {
    const start = Date.now();
    while (!document.querySelector('#algolia-autocomplete-container') &&
           !document.querySelector('[id^="algolia-autocomplete-container-mobile-"]')) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Algolia container not found within timeout.');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async waitForModules(timeoutMs = 5000) {
    const start = Date.now();
    while (!window.AlgoliaAutocompleteProducts || !window.AlgoliaAutocompleteArticles) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Algolia modules failed to load within timeout.');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async initAlgolia() {
    // Find all Algolia containers (desktop and mobile)
    const containers = [
      document.querySelector('#algolia-autocomplete-container'),
      ...document.querySelectorAll('[id^="algolia-autocomplete-container-mobile-"]')
    ].filter(Boolean);

    if (containers.length === 0) {
      throw new Error('No Algolia containers found');
    }

    await this.waitForModules();

    const { algoliasearch } = window.algoliasearch;
    this.searchClient = algoliasearch('GC3UDVL5DJ', '5b48556ccc38f74ea56d1fb1725dc6ea');

    this.productsModule = new window.AlgoliaAutocompleteProducts(this.searchClient);
    this.articlesModule = new window.AlgoliaAutocompleteArticles(this.searchClient);

    const { autocomplete } = window['@algolia/autocomplete-js'];

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';

    // Initialize autocomplete on all containers
    containers.forEach(container => {
      autocomplete({
        container: `#${container.id}`,
        openOnFocus: true,
        initialState: {
          query: initialQuery,
        },
        classNames: {
          input: 'search__input field__input',
          form: 'search__form',
          submitButton: 'search__button field__button',
          resetButton: 'reset__button field__button',
          panel: 'aa-Panel',
          panelLayout: 'aa-PanelLayout aa-PanelLayout--singleColumn',
        },
        getSources: this.getSources.bind(this),
        onSubmit: this.onSubmit.bind(this),
      });
    });

    this.setupFloatingLabel();
  }

  getSources({ query }) {
    if (!query) {
      return [];
    }

    const sources = [];

    // Add products source second (appears below articles)
    if (this.productsModule) {
      sources.push(this.productsModule.getSource());
    }

    // Add combined articles source first (appears above products)
    if (this.articlesModule) {
      sources.push(this.articlesModule.getCombinedSource());
    }

    return sources;
  }

  onSubmit({ state }) {
    const query = state.query;
    if (query) {
      const searchUrl = `/search?q=${encodeURIComponent(query)}`;
      window.location.href = searchUrl;
    }
  }

  setupFloatingLabel() {
    const container = document.querySelector('#algolia-autocomplete-container');
    const input = container?.querySelector('.aa-Input');

    if (!container || !input) return;

    input.addEventListener('focus', () => {
      container.classList.add('aa-Form--focused');
    });

    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        container.classList.remove('aa-Form--focused');
        container.removeAttribute('data-has-value');
      }
    });

    input.addEventListener('input', () => {
      if (input.value.trim()) {
        container.setAttribute('data-has-value', 'true');
      } else {
        container.removeAttribute('data-has-value');
      }
    });

    if (input.value.trim()) {
      container.setAttribute('data-has-value', 'true');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AlgoliaAutocomplete();
});
