/**
 * Copyright SubSocket.io
 * Version 1.1.8
 */


function SubSocketButton(singlePaymentID, versionTest = false, config, elementID, application, limit) {

  var sheet = document.createElement('style');
  sheet.innerHTML = ".subsocket_warning_img { width: 100% }";
  document.body.appendChild(sheet); // append in body

  if (document.querySelector('#' + elementID + ' .paypal-buttons') !== null) {

    document.querySelector('#' + elementID + ' .paypal-buttons').innerHTML = ''
  }

  var versionTest
  if (versionTest) {
    versionTest = 'version-test'
  } else {
    versionTest = 'version-live'
  }

  var today = new Date()
  var priorDate = new Date().setDate(today.getDate() - 30)
  var totalAmount = 0

  //Retrieve total count of subscription/transactions last 30 days
  //Retrieve total subscriptions
  fetch(
      `${"https://www.subsocket.io/"+versionTest+"/api/1.1/obj/subscriptions?constraints=%5B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%22key%22%3A%20%22Created%20Date%22%2C%0A%20%20%20%20%20%20%20%20%22constraint_type%22%3A%20%22greater%20than%22%2C%0A%20%20%20%20%20%20%20%20%22value%22%3A%20%22"+priorDate+"%22%0A%20%20%20%20%7D%2C%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%22key%22%3A%20%22Application%22%2C%0A%20%20%20%20%20%20%20%20%22constraint_type%22%3A%20%22equals%22%2C%0A%20%20%20%20%20%20%20%20%22value%22%3A%20%22"+application+"%22%0A%20%20%20%20%7D%0A%5D"}`
    )
    .then(function(response) {
      // The API call was successful!
      return response.json();
    })
    .then(function(data) {
      // This is the JSON from our response
      totalAmount += data.response.results.length
      console.log(totalAmount)
      amountTransactions()
    })
    .catch(function(err) {
      // There was an error
      console.warn(
        "Something went wrong with retrieving the Subscription amount from SubSocket.",
        err
      );
    });


  const amountTransactions = () => {

    //Retrieve total transacions
    fetch(
        `${"https://www.subsocket.io/"+versionTest+"/api/1.1/obj/transactions?constraints=%5B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%22key%22%3A%20%22Created%20Date%22%2C%0A%20%20%20%20%20%20%20%20%22constraint_type%22%3A%20%22greater%20than%22%2C%0A%20%20%20%20%20%20%20%20%22value%22%3A%20%22"+priorDate+"%22%0A%20%20%20%20%7D%2C%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%22key%22%3A%20%22Application%22%2C%0A%20%20%20%20%20%20%20%20%22constraint_type%22%3A%20%22equals%22%2C%0A%20%20%20%20%20%20%20%20%22value%22%3A%20%22"+application+"%22%0A%20%20%20%20%7D%0A%5D"}`
      )
      .then(function(response) {
        // The API call was successful!
        return response.json();
      })
      .then(function(data) {
        // This is the JSON from our response
        totalAmount += data.response.results.length
        console.log(totalAmount)
        if (totalAmount > limit && window.location.origin !== 'https://subsocket.io') {

          document.querySelector('#' + elementID + ' .paypal-buttons').style.display = 'none';
          var img = document.createElement('img');
          img.setAttribute("class", "subsocket_warning_img")
          img.src = 'https://s3.amazonaws.com/appforest_uf/f1620944861081x858362906518816800/SubSocket%20plan%20limit%20reached.png';
          var element = document.querySelector('#' + elementID)
          element.appendChild(img);

          const redirectToSubSocket = () => window.location.href = "https://subsocket.io"
          img.onclick = redirectToSubSocket

        }
      })
      .catch(function(err) {
        // There was an error
        console.warn(
          "Something went wrong with retrieving the Transaction amount from SubSocket.",
          err
        );
      });
  }

  //Recieve checkout details from SubSocket
  fetch(
      `${"https://www.subsocket.io/"+versionTest+"/api/1.1/obj/singlepayment/" + singlePaymentID}`
    )
    .then(function(response) {
      // The API call was successful!
      return response.json();
    })
    .then(function(data) {
      // This is the JSON from our response
      if (document.querySelector('#' + elementID + ' .paypal-buttons') == null) {
        setTimeout(function() {
          renderButton(data.response);
        }, 1)
      }
    })
    .catch(function(err) {
      // There was an error
      console.warn(
        "Something went wrong with retrieving the Checkout details from SubSocket.",
        err
      );
    });


  const renderButton = (response) => {

    var vat
    if (response.VAT == null || response.VAT == undefined || response.VAT == 0) {
      vat = 1
    } else {
      vat = (response.VAT / 100) + 1
    }

    var amount = response.Amount * vat

    paypal
      .Buttons({

        style: config.style,

        createOrder: function(data, actions) {
          // This function sets up the details of the transaction, including the amount and line item details.
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount
              }
            }]
          });
        },
        onApprove: function(data, actions) {
          // This function captures the funds from the transaction.
          return actions.order.capture().then(function(details) {
            // This function shows a transaction success message to your buyer.
            transactionSuccesful(response, details)
          });
        },

        onError: function(err) {
          // For example, redirect to a specific error page
          console.log(err)
        }
      })
      .render("#" + elementID);
  };



  const transactionSuccesful = (response, data) => {

    createTransaction(response, data)
  }

  const createTransaction = (response, data) => {

    var body = JSON.stringify({
      "Payment details (object)": data,
      "Single Payment": singlePaymentID,
      "id": data.id,
      "Application": application,
      "Sandbox mode": response['Sandbox mode'],
      "Name": data.payer.name.given_name + ' ' + data.payer.name.surname,
      "Email": data.payer.email_address,
      "Amount": data.purchase_units[0].amount.value,
      "Log": "Created using SubSocket button"
    })

    //POST API call to create subscription inside SubSocket
    fetch(`${"https://www.subsocket.io/"+versionTest+"/api/1.1/obj/Transactions"}`, {
        method: 'POST',
        body: body, // The data
        headers: {
          'Content-type': 'application/json' // The type of data you're sending
        }
      })

      .then(function(result) {
        // The API call was successful!
        console.log("Transaction successfully created in SubSocket")
        actionSuccessful(response, data)
      })

      .catch(function(err) {
        // There was an error
        console.warn(
          "Something went wrong with creating the subsciption in SubSocket.",
          err
        );
      });


    const actionSuccessful = (response, data) => {
      //Redirect user to success URL
      var successURL = response['Return URL']

      var url = new URL(successURL);
      var lengthURLParameters = Array.from(url.searchParams).length

      var finalURL
      if (lengthURLParameters == 0) {
        finalURL = successURL + '?payment_id=' + data.id + '&subsocket_single_payment_id=' + singlePaymentID
      } else if (lengthURLParameters > 0) {
        finalURL = successURL + '&payment_id=' + data.id + '&subsocket_single_payment_id=' + singlePaymentID
      }
      console.log('Redirecting to', finalURL)
      window.location.href = finalURL;
    }
  }
}
