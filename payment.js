document.getElementById('paymentButton').addEventListener('click', function() {
    // Effectuer une requête POST vers l'endpoint '/pay'
    fetch('/pay', {
      method: 'POST'
    })
    .then(response => {
      // Rediriger l'utilisateur vers la réponse de la requête
      window.location.href = response.url;
    })
    .catch(error => {
      console.error('Erreur lors de la demande de paiement:', error);
      // Gérer l'erreur de paiement
    });
  });
  