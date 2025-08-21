document.addEventListener('DOMContentLoaded', function () {
  // Function to reinitialize Rebuy
  function reinitializeRebuy() {
    if (typeof Rebuy !== 'undefined' && Rebuy.init) {
      Rebuy.init(); // Adjust this based on Rebuy’s actual API method
    }
  }

  setInterval(() => {
    reinitializeRebuy();
  }, 1000);
});

jQuery(document).ready(function () {
  jQuery('.get-help ul li#chat-with-us a').on('click', function (e) {
    e.preventDefault();
    if (window.GorgiasChat) {
      window.GorgiasChat.open();
    }
  });
});
$(document).ready(function () {
  $(".mobile-close-icon").on("click", function () {
    $(this).parents('details').removeAttr('open');
    $(this).parents('.mobile-facets__disclosure').removeClass('menu-opening');
    $('.facets-vertical').removeClass('facets-vertical-active');
    $('body').removeClass('overflow-hidden-mobile');
  });
});
