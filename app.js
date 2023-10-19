const express = require("express");
const app = express();
const port = 3000;

const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const paypal = require("paypal-rest-sdk");
const uuid = require("uuid");

// Configuration des middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set("view engine", "ejs");
app.set("trust proxy", 1); // trust first proxy

// Configuration de la connexion à la base de données MySQL
var connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "P@pamaman05",
  database: "Boutique",
});

// Configuration de PayPal SDK
paypal.configure({
  mode: "sandbox",
  client_id:
    "Ae58wfk1mOLx_dtBoa51I1XuozlfPrhvIypjqerV5ucswf3IbgRq43RTvdwrMjCwJ1wFMNFNiXTAMKe_",
  client_secret:
    "EPjVCVdzIAMUqPdhgGYHV8NqNEK1s8YBkkCORYYtnLA_1DaY9AX7kg79aa8pIku0t3F6ovFNXqXLTNC7",
});

// Middleware pour vérifier si l'utilisateur est connecté
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Configuration de la session
app.use(
  session({
    secret: "a19582de-12d8-11ee-be56-0242ac120002",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  })
);

// Connexion à la base de données
connection.connect((error) => {
  if (error) throw error;
  console.log("Connected to MySQL database Boutique");
});

// Page d'accueil
app.get("/", (req, res) => {
  const query = "SELECT * FROM Product";
  connection.query(query, (error, results) => {
    if (error) throw error;
    console.log("Les produits sont :", results);
    res.render("home", { resultats: results });
  });
});

// Page d'inscription
app.get("/register", (req, res) => {
  res.render("register");
});

// Gestion de l'inscription
app.post("/register", (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  // Générer le sel et hacher le mot de passe
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const query =
    "INSERT INTO Customer (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";

  connection.query(
    query,
    [first_name, last_name, email, hashedPassword],
    (error, results) => {
      if (error) {
        console.error("Error during registration:", error);
        res.render("register", { error: true });
      } else {
        res.redirect("/login");
      }
    }
  );
});

// Page de connexion
app.get("/login", (req, res) => {
  res.render("login");
});

// Gestion de la connexion
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Rechercher l'utilisateur dans la base de données
  const query = "SELECT * FROM Customer WHERE email = ? AND password = ?";
  connection.query(query, [email, password], (error, results) => {
    if (error) {
      console.error("Error during login:", error);
      res.redirect("/login?error=server_error");
      return;
    }

    console.log(results);

    if (results.length === 0) {
      // L'utilisateur n'existe pas ou les identifiants sont incorrects
      res.redirect("/login?error=invalid_credentials");
      return;
    }

    const user = results[0];

    // Authentification réussie
    req.session.user = {
      id: user.customer_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    req.session.cart = []; // Initialiser le panier d'achat de l'utilisateur

    res.redirect("/ejs");
  });
});

// Page d'affichage des produits avec panier
app.get("/ejs", requireLogin, (req, res) => {
  if (!req.session.panier) {
    req.session.panier = [];
  }

  const query = "SELECT * FROM Product";
  connection.query(query, (error, results) => {
    if (error) throw error;
    console.log("Les produits sont :", results);
    res.render("index", {
      resultats: results,
      sessionPanier: req.session.panier,
    });
  });
});

// Gestion de l'ajout au panier
app.post("/ejs", (req, res) => {
  const { productId, quantity } = req.body;

  // Retrouver les informations à partir du productId
  const query = "SELECT * FROM Product WHERE product_id = ?";
  connection.query(query, [productId], (error, results) => {
    if (error) throw error;

    const product = results[0];
    const item = {
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      weight: product.weight,
      image_url: product.image_url,
      quantity: parseInt(quantity),
    };

    // Récupérer ou initialiser le panier dans la session
    if (!req.session.panier) {
      req.session.panier = [];
    }

    // Ajouter l'élément au panier
    req.session.panier.push(item);
    res.redirect("/ejs");
  });
});

// Gestion du paiement avec PayPal
app.post("/pay", requireLogin, (req, res) => {
  const panier = req.session.panier || [];

  // Créer l'objet de paiement PayPal
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    },
    transactions: [
      {
        item_list: {
          items: panier.map((item) => ({
            name: item.name,
            price: item.price,
            currency: "CAD",
            quantity: item.quantity,
          })),
        },
        amount: {
          currency: "CAD",
          total: panier.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          ),
        },
        description: "Payment for items in the cart",
      },
    ],
  };

  // Créer le paiement PayPal
  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error("Error creating PayPal payment:", error);
      res.redirect("/error");
    } else {
      // Stocker l'ID de paiement dans la session
      req.session.paymentId = payment.id;

      // Rediriger l'utilisateur vers l'URL d'approbation du paiement PayPal
      const redirectUrl = payment.links.find(
        (link) => link.rel === "approval_url"
      ).href;
      res.redirect(redirectUrl);
    }
  });
});

// Page de succès après paiement PayPal
app.get("/success", requireLogin, (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.session.paymentId;

  // Exécuter le paiement PayPal
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "CAD",
          total: req.session.panier.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          ),
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
    if (error) {
      console.error("Error executing PayPal payment:", error);
      res.redirect("/error");
    } else {
      // Effacer le panier et l'ID de paiement de la session
      req.session.panier = [];
      req.session.paymentId = null;

      // Insérer les données de la commande dans la base de données
      const orderQuery = "INSERT INTO OrderTable (customer_id) VALUES (?)";
      connection.query(
        orderQuery,
        [req.session.user.id],
        (orderError, orderResult) => {
          if (orderError) {
            console.error("Error inserting order data:", orderError);
            res.redirect("/error");
          } else {
            const orderId = orderResult.insertId;

            // Insérer les données de la commande de produit dans la base de données de manière asynchrone
            const productOrderQuery =
              "INSERT INTO ProductOrder (order_id, product_id) VALUES (?, ?)";
            const productOrderPromises = req.session.panier.map((item) => {
              return new Promise((resolve, reject) => {
                connection.query(
                  productOrderQuery,
                  [item.id, orderId],
                  (productOrderError, productOrderResult) => {
                    if (productOrderError) {
                      console.error(
                        "Error inserting product order data:",
                        productOrderError
                      );
                      reject(productOrderError);
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });

            // Attendre que toutes les insertions de commande de produit soient terminées
            Promise.all(productOrderPromises)
              .then(() => {
                // Rediriger l'utilisateur vers une page de succès
                res.redirect("/ejs");
              })
              .catch((error) => {
                console.error("Error inserting product order data:", error);
                res.redirect("/error");
              });
          }
        }
      );
    }
  });
});

// Page des commandes du client
app.get("/customer-orders", requireLogin, (req, res) => {
  const customerId = req.session.user.id;

  // Requête pour récupérer les commandes du client et les informations des produits associées
  const query = `
      SELECT o.order_id, po.product_id, p.name, p.description, p.price, p.image_url
      FROM Customer c
      JOIN OrderTable o ON c.customer_id = o.customer_id
      JOIN ProductOrder po ON o.order_id = po.order_id
      JOIN Product p ON po.product_id = p.product_id
      WHERE c.customer_id = ?
    `;

  connection.query(query, [customerId], (error, results) => {
    if (error) throw error;

    const customerOrders = results.reduce((acc, row) => {
      const order = acc.find((o) => o.order_id === row.order_id);
      if (order) {
        order.products.push({
          product_id: row.product_id,
          name: row.name,
          description: row.description,
          price: row.price,
          image_url: row.image_url,
        });
      } else {
        acc.push({
          order_id: row.order_id,
          products: [
            {
              product_id: row.product_id,
              name: row.name,
              description: row.description,
              price: row.price,
              image_url: row.image_url,
            },
          ],
        });
      }
      return acc;
    }, []);

    console.log("Les commandes du client sont:", customerOrders);

    res.render("customer-orders", { customerOrders });
  });
});

// Démarrer le serveur sur le port spécifié
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

