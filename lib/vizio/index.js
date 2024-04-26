"use strict";

const assert = require("assert");
const https = require("../https");

const apiUrl = {
  sandbox: "https://preprod.api.developer-vizio.external.plat.vizio.com",
  production: "https://https://api.developer-vizio.external.plat.vizio.com",
};

function parseResult(resultString) {
  const result = JSON.parse(resultString);
  return {
    receipt: result,
    transactionId: result.orderNumber,
    productId: result.contentId,
    purchaseDate: new Date(result.createdDate).getTime(),
    expirationDate: null,
  };
}

exports.verifyPayment = function (payment, cb) {
  try {
    assert.equal(typeof payment.partner, "string", "Partner must be a string");
    assert.equal(typeof payment.receipt, "string", "Receipt must be a string");
    assert.equal(
      typeof payment.secretKey,
      "string",
      "SecretKey must be a string"
    );
  } catch (error) {
    return process.nextTick(function () {
      cb(error);
    });
  }

  const url = payment.sandbox ? apiUrl.sandbox : apiUrl.production;
  const requestUrl = `${url}/entitlements/v1/transactions/${payment.partner}/orders/${payment.receipt}`;

  https.get(
    requestUrl,
    { headers: { "x-tyk-key": payment.secretKey } },
    function (error, res, resultString) {
      if (error) {
        return cb(error);
      }

      if (res.statusCode !== 200) {
        return cb(
          new Error(
            `Received ${res.statusCode} status code with body: ${resultString}`
          )
        );
      }

      let resultObject = null;

      try {
        resultObject = parseResult(resultString);
      } catch (error) {
        return cb(error);
      }

      if (resultObject.error) {
        return cb(new Error(resultObject.error));
      }

      cb(null, resultObject);
    }
  );
};
