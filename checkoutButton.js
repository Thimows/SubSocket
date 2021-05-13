/**
 * Copyright SubSocket.io
 * Version 1.1.7
 */

function SubSocketButton(checkoutID, versionTest = false, config, elementID, application) {

  if (document.querySelector('#' + elementID + ' .paypal-buttons') !== null) {

    document.querySelector('#' + elementID + ' .paypal-buttons').innerHTML = ''
  }

  var versionTest
  if (versionTest) {
    versionTest = 'version-test'
  } else {
    versionTest = 'version-live'
  }
  

  //Recieve checkout details from SubSocket
  fetch(
      `${"https://www.subsocket.io/"+versionTest+"/api/1.1/obj/checkout/" + checkoutID}`
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
    console.log(response)
    paypal
      .Buttons({

        style: config.style,

        createSubscription: function(data, actions) {
          return actions.subscription.create({
            plan_id: response["Plan ID"]
          });
        },

        onApprove: function(data, actions) {
          createSubscription(response, data.subscriptionID)
        },

        onError: function(err) {
          // For example, redirect to a specific error page
          console.log(err)
        }
      })
      .render("#" + elementID);
  };
  

  const createSubscription = (response, subscriptionID) => {

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      "checkout_id": checkoutID,
      "sandbox": response["Sandbox mode"],
      "application": application,
      "version": versionTest,
      "subscription_id": subscriptionID,
      "response": response
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    fetch("https://subsocket.herokuapp.com", requestOptions)
      .then(response => {
        response.json()
        actionSuccessful(response, subscriptionID)
      })
      .then(result => console.log(result))
      .catch(error => console.log('error', error));
  }


  const actionSuccessful = (response, subscriptionID) => {
    //Redirect user to success URL
    var successURL = response['Succes URL']

    var url = new URL(successURL);
    var lengthURLParameters = Array.from(url.searchParams).length

    var finalURL
    if (lengthURLParameters == 0) {
      finalURL = successURL + '?subscription_id=' + subscriptionID + '&checkout_id=' + checkoutID
    } else if (lengthURLParameters > 0) {
      finalURL = successURL + '&subscription_id=' + subscriptionID + '&checkout_id=' + checkoutID
    }
    console.log('Redirecting to', finalURL)
    window.location.href = finalURL;
  }
}
