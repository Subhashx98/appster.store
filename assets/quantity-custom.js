$(document).ready(function () {
  // Handle the quantity change
  $(document).on('click', '.quantity_block .increase-qty', function () {
    console.log("clicked");
    let productCard = $(this).parents('.quantity-form');
    let quantity = parseInt($(productCard).find('input[name="quantity"]').val());
    quantity += 1;
    $(productCard).find('input[name="quantity"]').val(quantity);
  });

  $(document).on('click', '.quantity_block .decrease-qty', function () {
    let productCard = $(this).parents('.quantity-form');
    let quantity = parseInt($(productCard).find('input[name="quantity"]').val());
    if (quantity > 1) {
      quantity -= 1;
    }
    $(productCard).find('input[name="quantity"]').val(quantity);
  });
  $(document).on('submit', 'form[name="customAddToCart"]', function (e) {
    e.preventDefault();
    const $form = $(this);
    const formData = $form.serializeArray();

    customAddToCartProduct(formData, $form);
  });
});

function customAddToCartProduct(formData, $form) {
  let data;
  $form.find("button").attr('disabled', true);
  $form.find(".loading__spinner").removeClass('hidden');

  const hasItemsField = formData.some((field) => field.name === 'items');
  if (hasItemsField) {
    const itemsField = formData.find((field) => field.name === 'items');
    try {
      data = JSON.parse(itemsField.value);
    } catch (error) {
      console.error("Error parsing 'items' field:", error);
      $form.find("button").attr('disabled', false);
      $form.find(".loading__spinner").addClass('hidden');
      return;
    }
  } else {
    const item = {};
    formData.forEach((field) => {
      const name = field.name;
      const value = field.value;

      // Handle line item properties
      const propMatch = name.match(/^properties\[(.+)\]$/);
      if (propMatch) {
        const propName = propMatch[1];
        item.properties = item.properties || {};
        item.properties[propName] = value;
      } else {
        item[name] = value;
      }
    });

    data = [item];
  }

  const generatedFormData = {
    items: data,
    sections: ['cart-drawer', 'cart-icon-bubble'],
    sections_url: window.location.pathname,
  };

  fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(generatedFormData),
  })
    .then((response) => {
      if (!response.ok) {
        if ($form.find('.quantity-error').length > 0) {
          $form.find('.quantity-error').css('display', 'flex');
        }
        if ($form.siblings('.quantity-error').length > 0) {
          $form.siblings('.quantity-error').css('display', 'flex');
        }
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.renderContents(data);
        cartDrawer.open();
      }
    })
    .catch((error) => {
      console.error('Error adding to cart:', error);
    })
    .finally(() => {
      $form.find("button").attr('disabled', false);
      $form.find(".loading__spinner").addClass('hidden');
      if ($('cart-drawer').hasClass('is-empty')) {
        $('cart-drawer').removeClass('is-empty');
      }
    });
}
