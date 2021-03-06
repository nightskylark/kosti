let contentLib = require("/lib/xp/content");
let portal = require("/lib/xp/portal");
let norseUtils = require("norseUtils");
let sharedLib = require("sharedLib");
let cartLib = require("cartLib");
let hashLib = require("hashLib");
let checkoutLib = require("checkoutLib");
let thymeleaf = require("/lib/thymeleaf");
var httpClientLib = require("/lib/http-client");
var contextLib = require("contextLib");
var mailsLib = require("mailsLib");

exports.getSoldTicketsAmount = getSoldTicketsAmount;
exports.getPriceBlock = getPriceBlock;
exports.checkLiqpayOrderStatus = checkLiqpayOrderStatus;

function checkLiqpayOrderStatus() {
  var carts = cartLib.getPendingLiqpayCarts();
  norseUtils.log(carts.length + " total pending carts found.");
  for (var i = 0; i < carts.length; i++) {
    norseUtils.log("fixing cart " + carts[i].userId);
    var data = hashLib.generateLiqpayData(
      checkoutLib.getLiqpayStatusData(carts[i])
    );
    var signature = hashLib.generateLiqpaySignature(data);
    var result = JSON.parse(
      httpClientLib.request({
        url: "https://www.liqpay.ua/api/request",
        method: "POST",
        connectionTimeout: 2000000,
        readTimeout: 500000,
        body: "data=" + data + "&signature=" + signature + "",
        contentType: "application/x-www-form-urlencoded"
      }).body
    );
    if (result && result.status && result.status === "success") {
      norseUtils.log("cart is paid");
      checkoutLib.checkoutCart(carts[i], "paid");
      carts[i] = contextLib.runAsAdmin(function() {
        return (carts[i] = cartLib.generateItemsIds(carts[i]._id));
      });
      norseUtils.log("sending mail");
      mailsLib.sendMail("orderCreated", carts[i].email, {
        cart: carts[i]
      });
    }
  }
}

function getPriceBlock(id) {
  let product = contentLib.get({ key: id });
  let view = resolve("../pages/components/store/price.html");
  let price = product.data.price;
  let finalPrice = product.data.finalPrice;
  return thymeleaf.render(view, {
    product: product,
    sale:
      product.data.price &&
      product.data.finalPrice &&
      product.data.price < product.data.finalPrice
  });
}

function getSoldTicketsAmount(ids) {
  if (!ids) return false;
  let cartRepo = sharedLib.connectRepo("cart");
  ids = norseUtils.forceArray(ids);
  let orders = cartRepo.query({
    start: 0,
    count: -1,
    query: "items.id in ('" + ids.join("','") + "') and status = 'paid'"
  });
  let result = 0;
  for (let i = 0; i < orders.hits.length; i++) {
    result += countTickets(orders.hits[i].id, ids);
  }
  return result;
}

function countTickets(orderId, itemIds) {
  let cartRepo = sharedLib.connectRepo("cart");
  let order = cartRepo.get(orderId);
  let result = 0;
  order.items = norseUtils.forceArray(order.items);
  for (let i = 0; i < order.items.length; i++) {
    if (itemIds.indexOf(order.items[i].id) !== -1 && order.items[i].itemsIds) {
      order.items[i].itemsIds = norseUtils.forceArray(order.items[i].itemsIds);
      result += order.items[i].itemsIds.length;
    }
  }
  return result;
}
