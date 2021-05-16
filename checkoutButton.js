/**
 * Copyright SubSocket.io
 * Version 1.1.11
 */

function SubSocketButton(checkoutID, versionTestPara = true, config, elementID, application, limit, clientID) {

  var script = document.createElement('script');
  script.onload = function() {


    var sheet = document.createElement('style');
    sheet.innerHTML = ".subsocket_warning_img { width: 100% }";
    document.body.appendChild(sheet); // append in body


    if (document.querySelector('#' + elementID + ' .paypal-buttons') !== null) {

      document.querySelector('#' + elementID + ' .paypal-buttons').innerHTML = ''
    }

    var versionTest
    if (versionTestPara == true) {
      versionTest = 'version-test'
    } else if (versionTestPara == false) {
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
        //console.log(totalAmount)
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
          //console.log(totalAmount)
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
      //console.log(response)
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
        .then(responseFromHeroku => {
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
  script.src = 'https://www.paypal.com/sdk/js?client-id=' + clientID + '&vault=true&intent=subscription&disable-funding=credit';
  document.head.appendChild(script)
}
