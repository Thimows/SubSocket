/**
 * Copyright SubSocket.io
 * Version 1.1.6
 */


function SubSocketButton(singlePaymentID, versionTest = false, config, elementID, application) {

  if (document.querySelector('#' + elementID + ' .paypal-buttons') !== null) {

    document.querySelector('#' + elementID + ' .paypal-buttons').innerHTML = ''
  }

  var versionTest
  if (versionTest) {
    verstionTest = 'version-test'
  } else {
    verstionTest = 'version-live'
  }

  //Recieve checkout details from SubSocket
  fetch(
    `${"https://www.subsocket.io/"+verstionTest+"/api/1.1/obj/singlepayment/" + singlePaymentID}`
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
   
    var amount = response.Amount  * vat
    
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
      "Name": data.payer.name.given_name + ' ' + data.payer.name.surname ,
      "Email": data.payer.email_address,
      "Amount": data.purchase_units[0].amount.value,
      "Log": "Created using SubSocket button"
    })

    //POST API call to create subscription inside SubSocket
    fetch(`${"https://www.subsocket.io/"+verstionTest+"/api/1.1/obj/Transactions"}`, {
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
      } else if (lengthURLParameters > 0){
        finalURL = successURL + '&payment_id=' + data.id + '&subsocket_single_payment_id=' + singlePaymentID
      }
      console.log('Redirecting to', finalURL)
      window.location.href = finalURL;
    }
    }
  }
