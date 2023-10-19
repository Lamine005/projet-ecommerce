CREATE DATABASE Boutique;
USE Boutique;


-- Table "Product" (Produit)
CREATE TABLE Product (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  description VARCHAR(255),
  price DECIMAL(10,2),
  image_url VARCHAR(255),
  sku VARCHAR(50),
  weight DECIMAL(10,2)
 );
 
CREATE TABLE Customer (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(255)
);




CREATE TABLE OrderTable  (
  order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT,
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);


ALTER TABLE OrderTable 
ADD COLUMN quantity INT;

ALTER TABLE ProductOrder
DROP PRIMARY KEY,
DROP COLUMN product_order_id;


CREATE TABLE ProductOrder (
  product_id INT,
  order_id BIGINT,
  FOREIGN KEY (product_id) REFERENCES Product(product_id),
  FOREIGN KEY (order_id) REFERENCES OrderTable(order_id)
);

DESCRIBE ProductOrder



INSERT INTO Product (name, description, price, image_url, sku, weight)
VALUES
    ('Maillot de football', 'Maillot de football professionnel', 49.99, 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/a86b647d-09b1-407b-859b-3ea00c34f2ee/maillot-de-football-dri-fit-fc-barcelone-2023-24-stadium-domicile-pour-W7ntDn.png', 'F001', 0.3),
    ('Short de basketball', 'Short de basketball respirant', 24.99, 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/fc4a9f70-ec6e-47da-9211-60de0077aa47/dri-fit-dna-basketball-shorts-R9MVcm.png', 'B001', 0.2),
    ('Chaussures de running', 'Chaussures de running légères et amortissantes', 89.99, 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/9a48e0cc-5f95-49f7-979d-27516805dc71/lebron-nxxt-gen-basketball-shoes-VShP8m.png', 'R001', 0.25),
    ('Raquette de badminton', 'Raquette de badminton en graphite', 59.99, 'https://fglprdcdn.azureedge.net/images/316604-pink-1-Large.jpg', 'BD001', 0.3),
    ('Gants de boxe', 'Gants de boxe en cuir', 39.99, 'https://fglprdcdn.azureedge.net/images/508053-na-1-Large.jpg', 'BX001', 0.35),
    ('Planche de surf', 'Planche de surf en fibre de verre', 299.99, 'https://cdn.shoplightspeed.com/shops/601709/files/44931722/800x1024x2/salt-gypsy-dusty-retro-longboard-vintage-blue-tint.jpg', 'S001', 3.5),
    ('Tapis de yoga', 'Tapis de yoga antidérapant', 29.99, 'https://fglprdcdn.azureedge.net/images/72878-black-1-Large.jpg', 'Y001', 1.0),
    ('Casque de vélo', 'Casque de vélo léger et aéré', 69.99, 'https://fglprdcdn.azureedge.net/images/802573-anobl-1-Large.jpg', 'V001', 0.4),
    ('Raquette de tennis de table', 'Raquette de tennis de table professionnelle', 49.99, 'https://fglprdcdn.azureedge.net/images/142931-na-1-Large.jpg', 'TT001', 0.15),
    ('Sac de sport', 'Sac de sport spacieux avec plusieurs compartiments', 39.99, 'https://fglprdcdn.azureedge.net/images/191570-410-1-Large.jpg', 'SP001', 1.2);

INSERT INTO Customer (first_name, last_name, email, password)
VALUES
    ('David', 'Villa', 'david.villa@gmail.com', 'Thanksgod'),
    ('Will', 'Smith', 'Will.wilson@gmail.com', 'mypasswordlol');