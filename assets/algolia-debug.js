document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Algolia Debug ===');
  console.log('window.algoliasearch:', window.algoliasearch);
  console.log('window.AlgoliaSearch:', window.AlgoliaSearch);
  console.log('window.algolia:', window.algolia);
  console.log('All window properties with "algolia":', 
    Object.keys(window).filter(key => key.toLowerCase().includes('algolia'))
  );
  console.log('window["@algolia/autocomplete-js"]:', window['@algolia/autocomplete-js']);
  console.log('=== End Debug ===');
});
