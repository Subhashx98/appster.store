class AlgoliaAutocompleteArticles {
  constructor(searchClient) {
    if (!searchClient) {
      throw new Error('Search client is required for AlgoliaAutocompleteArticles');
    }
    this.searchClient = searchClient;
  }

  getCombinedSource() {
    const { getAlgoliaResults } = window['@algolia/autocomplete-js'];
    
    if (!getAlgoliaResults) {
      throw new Error('getAlgoliaResults not found in autocomplete-js');
    }
    
    return {
      sourceId: 'articles_combined',
      getItems: ({ query }) => {
        if (!query) return [];
        
        return getAlgoliaResults({
          searchClient: this.searchClient,
          queries: [
            {
              indexName: 'shopify_articles',
              query,
              params: {
                hitsPerPage: 3, // Max 3 total articles
                filters: 'blog.title:"Article Library" OR blog.title:"How To Corner"',
                attributesToRetrieve: [
                  'title',
                  'handle',
                  'body_html_safe',
                  'author',
                  'published_at',
                  'tags',
                  'image',
                  'blog'
                ]
              }
            }
          ]
        });
      },
      templates: {
        item: this.getItemTemplate.bind(this),
        header: ({ html }) => this.getHeaderTemplate({ html, title: 'Articles & How-To' })
      },
      getItemUrl: this.getItemUrl.bind(this)
    };
  }

  // Keep the old methods for backward compatibility if needed
  getSources() {
    return [this.getCombinedSource()];
  }

  getArticleLibrarySource(getAlgoliaResults) {
    return {
      sourceId: 'shopify_articles',
      getItems: ({ query }) => {
        if (!query) return [];
        
        return getAlgoliaResults({
          searchClient: this.searchClient,
          queries: [
            {
              indexName: 'shopify_articles',
              query,
              params: {
                hitsPerPage: 3,
                filters: 'blog.title:"Article Library"',
                attributesToRetrieve: [
                  'title',
                  'handle',
                  'body_html_safe',
                  'author',
                  'published_at',
                  'tags',
                  'image',
                  'blog'
                ]
              }
            }
          ]
        });
      },
      templates: {
        item: this.getItemTemplate.bind(this),
        header: ({ html }) => this.getHeaderTemplate({ html, title: 'Article Library' })
      },
      getItemUrl: this.getItemUrl.bind(this)
    };
  }

  getHowToCornerSource(getAlgoliaResults) {
    return {
      sourceId: 'shopify_howto',
      getItems: ({ query }) => {
        if (!query) return [];
        
        return getAlgoliaResults({
          searchClient: this.searchClient,
          queries: [
            {
              indexName: 'shopify_articles',
              query,
              params: {
                hitsPerPage: 3,
                filters: 'blog.title:"How To Corner"',
                attributesToRetrieve: [
                  'title',
                  'handle',
                  'body_html_safe',
                  'author',
                  'published_at',
                  'tags',
                  'image',
                  'blog'
                ]
              }
            }
          ]
        });
      },
      templates: {
        item: this.getItemTemplate.bind(this),
        header: ({ html }) => this.getHeaderTemplate({ html, title: 'How To Corner' })
      },
      getItemUrl: this.getItemUrl.bind(this)
    };
  }

  getItemTemplate({ item, components, html }) {
    if (!item) {
      return html`<div>Error: No item data</div>`;
    }
    
    if (!components || !components.Highlight) {
      return html`<div>Error: Components not available</div>`;
    }
    
    const title = item.title || 'Untitled';
    const handle = item.handle || '';
    const blogHandle = item.blog?.handle || 'articles';
    const blogTitle = item.blog?.title || '';
    const image = item.image || '';
    
    try {
      return html`
        <div class="aa-ItemWrapper aa-ItemWrapper--articles">
          <div class="aa-ItemContent">
            <a href="/blogs/${blogHandle}/${handle}" class="aa-ItemLink">
              <div class="custom-item-image">
                ${image ? html`<img src="${image}" alt="${title}" class="custom-item-img" />` : ''}
              </div>
              <div class="aa-ItemContentBody">
                <div class="aa-ItemContentTitle">
                  <span class="aa-ItemTitleText">${components.Highlight({ hit: item, attribute: 'title' })}</span>
                </div>
                ${blogTitle ? html`<div class="aa-ItemBlogTitle">${blogTitle}</div>` : ''}
                <div class="aa-ItemContentDescription">
                </div>
              </div>
            </a>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating articles template:', error);
      return html`<div>Error rendering article</div>`;
    }
  }


  getHeaderTemplate({ html, title }) {
    try {
      return html`
        <div class="aa-SourceHeader">
          <span class="aa-SourceHeaderTitle">${title}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error generating articles header template:', error);
      return html`<div>${title}</div>`;
    }
  }

  getItemUrl({ item }) {
    if (!item || !item.handle) {
      console.error('Articles: Missing required URL properties', item);
      return '#';
    }
    
    const blogHandle = item.blog?.handle || 'articles';
    return `/blogs/${blogHandle}/${item.handle}`;
  }
}

window.AlgoliaAutocompleteArticles = AlgoliaAutocompleteArticles;
