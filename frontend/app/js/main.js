function initPDPFunctions() {
  $(".qty-decrement").on("click", function() {
    var selector = ".qty-input[data-id=" + $(this).data().id + "]";
    $(this).data().size
      ? (selector += "[data-size=" + $(this).data().size + "]")
      : false;
    var input = $(selector);
    input.val(Math.max(parseInt(input.val()) - 1, 1));
    if ($(".cart-list").length > 0) {
      addToCartOnclick(input);
    }
  });
  $(".qty-input").on("change", function() {
    var input = $(this);
    if (isNaN(parseInt(input.val())) || parseInt(input.val()) < 1) {
      input.val("1");
    }
    input.val(Math.max(parseInt(input.val()), 1));
    if ($(".cart-list").length > 0) {
      addToCartOnclick(input);
    }
  });
  $(".qty-increment").on("click", function() {
    var selector = ".qty-input[data-id=" + $(this).data().id + "]";
    $(this).data().size
      ? (selector += "[data-size=" + $(this).data().size + "]")
      : false;
    var input = $(selector);
    input.val(Math.max(parseInt(input.val()) + 1, 1));
    if ($(".cart-list").length > 0) {
      addToCartOnclick(input);
    }
  });
  $(".pdp-image-item img").on("click", function(e) {
    e.preventDefault();
    var prevImg = $(".pdp-main_image")
      .find("img")
      .attr("src");
    $(".pdp-main_image")
      .find("img")
      .attr("src", $(this).attr("src"));
    if (window.outerWidth >= 768) {
      $(".pdp-main_image").zoom({ url: $(this).attr("src") });
    }
    $(this).attr("src", prevImg);
  });
  $(".add_to_cart-btn").on("click", function(e) {
    e.preventDefault();
    if ($("#pdp-size-select").length && !$("#pdp-size-select").val()) {
      $("#pdp-size-select").addClass("is-invalid");
    } else {
      $("#pdp-size-select").removeClass("is-invalid");
      addToCart();
    }
  });
  $("#pdp-size-select").on("change", function() {
    $(".pdp-validation").addClass("hidden");
    $("#pdp-size-select").removeClass("is-invalid");
  });
  if (typeof pdpImageUrl !== "undefined") {
    if (window.outerWidth >= 768) {
      $(".pdp-main_image").zoom({ url: pdpImageUrl });
    }
  }
}

function addToCartOnclick(input) {
  var data = {
    itemId: input.data().id,
    size: input.data().size,
    amount: input.val(),
    cartId: getCookieValue("cartId"),
    action: "modify",
    force: true
  };
  addToCart(data);
}

function initCheckoutEvents() {
  $(".checkout-action .checkout-continue").on("click", function(e) {
    validateCheckout(e);
  });
  $("form.checkout-form").on("submit", function(e) {
    validateCheckout(e);
  });
  $("#phone-checkout-input").on("change paste keyup", function() {
    $("#phone-checkout-input").val(
      $("#phone-checkout-input")
        .val()
        .replace(/\D+/g, "")
    );
  });
  $(".checkout-form input, .checkout-form select").on("change", function() {
    if ($(this).val() != "") {
      $(this)
        .parent()
        .removeClass("is-invalid");
    }
  });
  $(".js_promo_code-title").on("click", function() {
    $(this)
      .parent()
      .toggleClass("show");
  });
  $(".js_promo-form").on("click", ".js_promo-remove", function(e) {
    e.preventDefault();
    var code = $(this).data("code");
    var call = makeAjaxCall(
      "/promos",
      "POST",
      {
        action: "removePromo",
        cartId: getCookieValue("cartId"),
        code: code
      },
      true
    );
    call.done(function(data) {
      $(".js_promo_code-used_list").html(data.promos);
      $(".js_summary-discount .value span").text(
        data.cart.price.discount.discount
      );
      $(".js_summary-total .value span").text(data.cart.price.totalDiscount);
    });
  });
  $(".js_promo-form").on("submit", function(e) {
    e.preventDefault();
    var formData = getFormData(this);
    formData.cartId = getCookieValue("cartId");
    var call = makeAjaxCall("/promos", "POST", formData, true);
    call.done(function(data) {
      $(".js_promo_code-used_list").html(data.promos);
      $(".js_summary-discount .value span").text(
        data.cart.price.discount.discount
      );
      $(".js_summary-total .value span").text(data.cart.price.totalDiscount);
    });
  });

  $(".delivery_np-input-city").on("input", function() {
    if ($(this).val().length > 1) {
      var dataCity = {
        apiKey: "8913262e83513c669457b8c48224f3ab",
        modelName: "Address",
        calledMethod: "searchSettlements",
        methodProperties: {
          Limit: "10"
        }
      };
      dataCity.methodProperties.CityName = $(".delivery_np-input-city").val();

      $.ajax({
        url: "https://api.novaposhta.ua/v2.0/json/",
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(dataCity),
        success: function(response) {
          $("#suggestion-list").html("");
          var dataIncome = response.data[0].Addresses;
          for (var i = 0; i < dataIncome.length; i++) {
            $("#suggestion-list").append(
              "<li data-ref='" +
                dataIncome[i].DeliveryCity +
                "'>" +
                dataIncome[i].MainDescription +
                "</li>"
            );
          }
        }
      });
    }
  });
  $("#suggestion-list").on("click", "li", function() {
    $(".delivery_np-input-city").val($(this).text());
    $(".delivery_np-input-city").data("ref", $(this).data("ref"));
    $("#suggestion-list").html("");
    var dataCity = {
      apiKey: "8913262e83513c669457b8c48224f3ab",
      modelName: "AddressGeneral",
      calledMethod: "getWarehouses",
      methodProperties: {
        Language: "ru",
        Limit: "99999",
        CityRef: $(this).data("ref")
      }
    };

    $.ajax({
      url: "https://api.novaposhta.ua/v2.0/json/",
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(dataCity),
      success: function(response) {
        $("#delivery_np-warehouses").html(
          '<option disabled="disabled" selected="selected">Выберите отделение</option>'
        );
        for (var i = 0; i < response.data.length; i++) {
          $("#delivery_np-warehouses").append(
            '<option value="' +
              response.data[i].DescriptionRu +
              '">' +
              response.data[i].DescriptionRu +
              "</option>"
          );
        }
      }
    });
  });
  $("#suggestion-list").on("click", "li", function() {
    var dataCity = {
      apiKey: "8913262e83513c669457b8c48224f3ab",
      modelName: "InternetDocument",
      calledMethod: "getDocumentPrice",
      methodProperties: {
        CitySender: "e221d627-391c-11dd-90d9-001a92567626",
        CityRecipient: $(".delivery_np-input-city").data("ref"),
        Weight: $("#cartWeight").val(),
        ServiceType: "WarehouseWarehouse",
        Cost: "100",
        CargoType: "Parcel",
        SeatsAmount: "1"
      }
    };

    $.ajax({
      url: "https://api.novaposhta.ua/v2.0/json/",
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(dataCity),
      success: function(response) {
        $(".delivery_m-subtitle").text("UAH " + response.data[0].Cost);
        $("input[name=shippingPrice]").val(response.data[0].Cost);
      }
    });
  });
}

function initSharedEvents() {
  setCookie(cartId);
  $(
    ".similar_posts, .blog-list, .article-body, .blog-sidebar, .js_homepage_slider"
  ).on("click", ".js_like-article", function(e) {
    e.preventDefault();
    if (checkUserLoggedIn()) {
      doUpvote(this);
    } else {
      showLogin(e);
    }
  });

  $("a.social-link.facebook").on("click", function(e) {
    window.open(
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(window.location.href),
      "facebook-share-dialog",
      "width=626,height=436"
    );
    return false;
  });

  if ($(window).width() < 768) {
    $(".mobile_menu").on("click", function() {
      $(this).toggleClass("open");
      $(".header").toggleClass("open");
    });
  }

  if ($("form[name=payment]").length > 0) {
    $("form[name=payment]").submit();
  }
  if ($("#payment-success").length > 0) {
    deleteCookie("cartId");
  }
  $(
    ".similar_posts, .blog-list, .article-body, .blog-sidebar, .js_homepage_slider"
  ).on("click", ".js_bookmarks", function(e) {
    if (checkUserLoggedIn()) {
      var btn = $(this);
      $.ajax({
        url: "/_/service/com.myurchenko.kostirpg/user",
        type: "POST",
        async: true,
        data: {
          id: $(this).data().contentid,
          action: "addBookmark"
        },
        success: function(data) {
          if (data === true) {
            btn.addClass("active");

            if (!isEmpty(btn)) {
              btn.text("В ЗАКЛАДКАХ");
            }
          } else {
            btn.removeClass("active");

            if (!isEmpty(btn)) {
              btn.text("В ЗАКЛАДКИ");
            }
          }
        }
      });
    } else {
      showLogin(e);
    }
  });
  if ($(".blog-list").length > 0) {
    $(document).on("scroll", function() {
      if (
        $(document).scrollTop() + $(window).height() + 150 >
        $(document).height()
      ) {
        if (!$(".blog-list").data("noMoreArticles")) {
          loadMoreArticles();
        }
      }
    });
  }
  $(document).on("scroll", function() {
    if ($(document).scrollTop() > 1200) {
      $(".js_back_to_top").removeClass("hidden");
    } else {
      $(".js_back_to_top").addClass("hidden");
    }
  });
  $(".js_back_to_top").on("click", function() {
    $("html,body").animate({ scrollTop: 0 }, "slow");
    $(".js_back_to_top").addClass("hidden");
    return false;
  });
}

function loadMoreArticles() {
  $(".js_lazyload-icon").removeClass("hidden");
  var page = $(".blog-list").data("page");
  if (!page) {
    page = 0;
  }
  var feedType = $(".blog-list").data("feedtype");
  var query = $(".blog-list").data("query");
  var call = makeAjaxCall(
    contentServiceUrl,
    "GET",
    {
      feedType: feedType
        ? feedType
        : $(".js_blog-navigation .active").data("type"),
      page: page,
      query: query ? query : null,
      userId: $(".js_user-page-id").data("userid")
    },
    false
  );
  call.done(function(data) {
    if (data.trim() === "") {
      $(".blog-list").append(
        "<div class='blog-list-empty'>Статей больше нет.</div>"
      );
      $(".blog-list").data("noMoreArticles", true);
    } else {
      $(".blog-list").append(data);
    }
    $(".js_lazyload-icon").addClass("hidden");
    $(".blog-list").data("page", page + 1);
  });
}

function initCartFunctions() {
  $(".js_cart-remove_btn").on("click", function() {
    var data = {
      itemId: $(this).data().id,
      size: $(this).data().size,
      amount: 0,
      cartId: $("#ordersAdminCartID").length
        ? $("#ordersAdminCartID").val()
        : getCookieValue("cartId"),
      action: "modify",
      force: true
    };
    var data = addToCart(data);
    removeItemFromDOM(this);
    function removeItemFromDOM(el) {
      $(el)
        .closest(".cart-item")
        .remove();
    }
  });
}

$(document).ready(function() {
  initSharedEvents();
  initLoginRegisterForm();
  initCheckoutEvents();
  initCartFunctions();
  initHeaderFunctions();
  initPDPFunctions();
  if ($("body.article-page").length > 0) {
    addArticleViews();
  }
});

function addToCart(data) {
  var data = data;
  if (!data) {
    data = {
      action: "modify",
      cartId: getCookieValue("cartId"),
      itemId: $("input[name=productId]").val(),
      amount: $("input[name=quantity]").val(),
      size: $("select[name=itemSize]").val()
    };
  }
  $(".minicart .minicart-qty").removeClass("animate");
  $.ajax({
    url: cartServiceUrl,
    type: "POST",
    data: data,
    success: function(data) {
      setCookie(data._id);
      $(".minicart .minicart-total").html("UAH " + data.price.items);
      $(".minicart .minicart-qty").text(
        parseInt(data.itemsNum) > 99 ? "9+" : data.itemsNum
      );
      $(".cart-total .value .cart-items-price").text(data.price.items);
      $(".minicart .minicart-qty").addClass("animate");
      if (data.stock) {
        $(".checkout-action .checkout-continue").removeClass("not-active");
      } else {
        $(".checkout-action .checkout-continue").addClass("not-active");
      }
      for (var i = 0; i < data.items.length; i++) {
        var selector =
          ".cart-product_price-wrap[data-id=" + data.items[i]._id + "]";
        data.items[i].itemSize
          ? (selector += "[data-size=" + data.items[i].itemSize + "]")
          : false;
        if (data.items[i].stock && data.items[i].itemSizeStock) {
          $(selector)
            .find(".productPrice")
            .removeClass("hidden");
          $(selector)
            .find(".productOutOfStock")
            .addClass("hidden");
        } else {
          $(selector)
            .find(".productPrice")
            .addClass("hidden");
          $(selector)
            .find(".productOutOfStock")
            .removeClass("hidden");
        }
      }
    }
  });
}

function validateCheckout(e) {
  $("form.checkout-form input, form.checkout-form select").each(function() {
    if ($(this).val() == null || $(this).val() == "") {
      e.preventDefault();
      $(this)
        .parent()
        .addClass("is-invalid");
    }
  });
  var tel = $("#phone-checkout-input").val();
  if (tel && !validatePhone(tel)) {
    e.preventDefault();
    $("#phone-checkout-input")
      .parent()
      .addClass("is-invalid");
  }
  var email = $("#email-checkout-input").val();
  if (email && !validateEmail(email)) {
    e.preventDefault();
    $("#email-checkout-input")
      .parent()
      .addClass("is-invalid");
  }
  if ($("#agreement").length && !$("#agreement").is(":checked")) {
    e.preventDefault();
    $("#agreement")
      .parent()
      .addClass("is-invalid");
  }
  if (
    $("#delivery_np-warehouses").length &&
    (!$("#delivery_np-warehouses").val() ||
      $("#delivery_np-warehouses").val() == "")
  ) {
    e.preventDefault();
    $("#delivery_np-warehouses").addClass("is-invalid");
  }
  if (
    $("#delivery_np-input-city").length &&
    (!$("#delivery_np-input-city").val() ||
      $("#delivery_np-input-city").val() == "")
  ) {
    e.preventDefault();
    $("#delivery_np-input-city")
      .parent()
      .addClass("is-invalid");
  }
}
