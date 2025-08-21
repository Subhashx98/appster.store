$(document).ready(function () {
  // Handle the quantity change
  $(document).on("click", ".cstm-product-card #increase-qty", function () {
    let productCard = $(this).parents(".cstm-product-card");
    let quantity = parseInt(
      $(productCard).find('input[name="quantity"]').val()
    );
    quantity += 1;
    $(productCard).find('input[name="quantity"]').val(quantity);
    updateTotalPrice(productCard);
  });

  $(document).on("click", ".cstm-product-card #decrease-qty", function () {
    let productCard = $(this).parents(".cstm-product-card");
    let quantity = parseInt(
      $(productCard).find('input[name="quantity"]').val()
    );
    if (quantity > 1) {
      quantity -= 1;
    }
    $(productCard).find('input[name="quantity"]').val(quantity);
    updateTotalPrice(productCard);
  });

  $(document).on("submit", 'form[name="customAddToCart"]', function (e) {
    e.preventDefault();
    console.log("sss");
    const $form = $(this);
    const formData = $form.serializeArray();
    const variantID = $form.find('input[name="id"]').val();
    const productQuantity = $form.find('input[name="quantity"]').val();

    customAddToCartProduct(variantID, formData, $form);
  });
});

function customAddToCartProduct(variantID, formData, $form) {
  const data = {};
  $form.find("button").attr("disabled", true);
  $form.find(".loading__spinner").removeClass("hidden");

  formData.forEach((field) => {
    data[field.name] = field.value;
  });

  let generatedFormData = {
    items: [data],
    sections: ["cart-drawer", "cart-icon-bubble"],
    sections_url: window.location.pathname,
  };

  fetch(window.Shopify.routes.root + "cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(generatedFormData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const cartDrawer = document.querySelector("cart-drawer");
      if (cartDrawer) {
        cartDrawer.renderContents(data);
        cartDrawer.open();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      $form.find("button").attr("disabled", false);
      $form.find(".loading__spinner").addClass("hidden");
      if ($("cart-drawer").hasClass("is-empty"))
        $("cart-drawer").removeClass("is-empty");
    });
}

// Function to calculate and update the total quantity price
function updateTotalPrice(productCard) {
  let quantity =
    parseInt($(productCard).find('input[name="quantity"]').val()) || 0;
  let productPrice = $(productCard)
    .find(".quantity_input_block")
    .data("product-price");
  if (!productPrice) {
    console.error("Product price not found in data attribute");
    return;
  }
  let totalQuantityPrice = (productPrice * quantity) / 100;
  $(productCard)
    .find(".total_quantity_price")
    .text("$" + totalQuantityPrice.toFixed(2));
}
