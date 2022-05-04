/**
 * Market Simulation in p5JS
 *
 * @summary A p5js simulation of a market reaching equilibrium
 * @author Henry Burkhardt <henrywb04@gmail.com>
 *
 * Created at     : 2022-04-25
 */

//simulation progress controls
let run = false;

//storage arrays - "freeze arrays" exist to store values between days so they dont update every frame
let sellers = [];
let buyers = [];
let tempSellers = [];
let tempBuyers = [];
let transactedSellerPrices = [];
let transactedBuyerPrices = [];
let transactedSellerPricesFreeze = [];
let transactedBuyerPricesFreeze = [];

//size controls
const size = 100;
let w;
let h;
const radius = 10;
const padding = 16;

//price controls and tracking
const limitAmount = 2;
const pMin = 20;
const pMax = 30;
let priceFloor = 20;
let priceCeiling = 30;
let buyerAvg;
let sellerAvg;
let tax = 0.05;

//transactions counts
let totalTransactions = 0;
let dailyTransactions = 0;
let dailyTransactionFreeze = 0;

//surplus tracking
let totalBuyerSurplus = 0;
let totalBuyerSurplusFreeze = 0;

//time tracking
const transactionsPerDay = 85;
let transactionCount = 0;
let numberDays = 0;

//Seller (red) and Buyer (blue) Classes
class Seller {
  constructor() {
    this.y = 0;
    this.x = 0;
    this.price = 0;
    this.limit = 0;
  }
  show() {
    fill(235, 64, 52, ((pMax - this.price + 15) / pMax) * 255);
    ellipse(this.x, this.y, radius);
  }
}

class Buyer {
  constructor() {
    this.y = 0;
    this.x = 0;
    this.price = 0;
    this.limit = 0;
  }
  show() {
    fill(52, 110, 235, ((pMax - this.price + 15) / pMax) * 255);
    ellipse(this.x, this.y, radius);
  }
}

//Utility Functions
function drawUtility() {
  textSize(40);
  fill(255);
  text("Day " + numberDays, w / 2, 40);
  textSize(20);
  fill(235, 64, 52);
  textAlign(CENTER);
  text("$" + round(sellerAvg, 2), w / 4, 80);
  fill(52, 110, 235);
  textAlign(CENTER);
  text("$" + round(buyerAvg, 2), w - w / 4, 80);
  push();
  strokeWeight(3);
  stroke(0, 255, 0);
  line(
    w / 2 - 200,
    h * 0.3 + 100 + ((pMax - priceFloor) / (pMax - pMin)) * 200,
    w / 2 + 200,
    h * 0.3 + 100 + ((pMax - priceFloor) / (pMax - pMin)) * 200
  );
  stroke(0, 255, 255);
  line(
    w / 2 - 200,
    h * 0.3 + 100 + ((pMax - priceCeiling) / (pMax - pMin)) * 200,
    w / 2 + 200,
    h * 0.3 + 100 + ((pMax - priceCeiling) / (pMax - pMin)) * 200
  );
  pop();
}
function setRun(status) {
  run = status;
  return;
}

function getAvgPrice(array) {
  let total = 0;
  for (let a of array) {
    total = total + a;
  }
  return total / array.length;
}

function setPriceF(val) {
  priceFloor = val;
  document.getElementById("pFtext").innerHTML = String(val);
}

function setPriceC(val) {
  priceCeiling = val;
  document.getElementById("pCtext").innerHTML = String(val);
}

function setTax(val) {
  tax = parseFloat(val) / 100;
  document.getElementById("taxText").innerHTML = String(tax);
}

function setLines(val) {
  console.log(val);
}

//transaction simulation function
function transaction(seller, buyer, i1, i2, showStatus) {
  push();
  strokeWeight(4);
  stroke(255, 255, 255, 90);
  if (showStatus) {
    line(buyer.x, buyer.y, seller.x, seller.y);
  }
  pop();

  //transaction occurs:
  //  (1) reduce buyer price,
  //  (2) increase seller price,
  if (buyer.price >= seller.price + seller.price * tax) {
    totalTransactions = totalTransactions + 1;
    dailyTransactions = dailyTransactions + 1;
    transactedSellerPrices.push(seller.price);
    transactedBuyerPrices.push(buyer.price);

    totalBuyerSurplus = totalBuyerSurplus + (buyer.price - seller.price);
    const newBuyerPrice = buyer.price - (buyer.price - seller.price) / 2;
    const newSellerPrice = seller.price + (buyer.price - seller.price) / 2;

    buyer.price = newBuyerPrice;
    seller.price = newSellerPrice;
  }

  //transaction does not occur:
  //  (1) increase buyer price randomly,
  //  (2) reduce seller price randomly,
  //  (3) make sure neither exceeds limtis
  if (buyer.price < seller.price) {
    const newBuyerPrice = random(buyer.price, pMax);
    const newSellerPrice = random(priceFloor, seller.price);
    buyer.price = newBuyerPrice;
    if (newBuyerPrice < buyer.limit) {
      buyer.price = newBuyerPrice;
    } else {
      seller.price = seller.limit;
    }
    if (newSellerPrice > seller.limit) {
      seller.price = newSellerPrice;
    } else {
      seller.price = seller.limit;
    }
  }

  if (seller.price > priceCeiling) {
    seller.price = priceCeiling;
  }

  // if (seller.price < priceFloor) {
  //   seller.price = priceFloor;
  // }

  //regardless of transaction status, remove from current arrays and place in temp storage
  tempBuyers.push(buyer);
  tempSellers.push(seller);
  sellers.splice(i1, 1);
  buyers.splice(i2, 1);
}

//graph function to generate supply and demand curve
function graph2(buyers, sellers) {
  let xOrgin = w / 2 - 200;
  let yOrigin = h * 0.3 + 100;

  let lines = document.getElementById("lineCheckBox").checked;
  let points = document.getElementById("pointCheckBox").checked;

  let orderedBuyingPrices = [...buyers];
  let orderedSellingPrices = [...sellers];
  orderedBuyingPrices.sort();
  orderedSellingPrices.sort().reverse();

  //drawing graph outline and labels
  push();
  rectMode(CORNER);
  stroke(255, 0, 0);
  strokeWeight(2);
  fill(0);
  stroke(255);
  rect(xOrgin, yOrigin, 400, 200);
  noStroke();
  fill(255, 255, 255);
  textSize(15);
  text("Price", xOrgin - 20, yOrigin + 100);
  textAlign(CENTER);
  text("Quantity", xOrgin + 200, yOrigin + 220);
  pop();

  //drawing points and lines for sellers and buyers
  push();
  strokeWeight(5);
  stroke(52, 110, 235);
  let prevX, prevY;
  for (let i = 0; i < orderedBuyingPrices.length; i++) {
    curY = ((pMax - orderedBuyingPrices[i]) / (pMax - pMin)) * 200 + yOrigin;
    curX = (i / orderedBuyingPrices.length) * 400 + xOrgin;
    if (points) {
      point(curX, curY);
    }
    if (lines) {
      push();
      strokeWeight(2);
      stroke(52, 110, 235, 200);
      line(curX, curY, prevX, prevY);
      prevX = curX;
      prevY = curY;
      pop();
    }
  }

  prevX = xOrgin;
  prevY = ((pMax - orderedSellingPrices[0]) / (pMax - pMin)) * 200 + yOrigin;
  stroke(235, 64, 52);
  for (let i = 0; i < orderedSellingPrices.length; i++) {
    curY = ((pMax - orderedSellingPrices[i]) / (pMax - pMin)) * 200 + yOrigin;
    curX = (i / orderedSellingPrices.length) * 400 + xOrgin;
    if (points) {
      point(curX, curY);
    }
    if (lines) {
      push();
      strokeWeight(2);
      stroke(235, 64, 52, 200);
      line(curX, curY, prevX, prevY);
      prevX = curX;
      prevY = curY;
      pop();
    }
  }
  pop();
}

function setup() {
  w = windowWidth;
  h = windowHeight;
  c = createCanvas(w, h);
  c.parent("canvas");

  //create sellers
  for (let i = 0; i < Math.sqrt(size); i++) {
    for (let j = 0; j < Math.sqrt(size); j++) {
      s = new Seller();
      s.x = w * 0.25 + padding * i;
      s.y = h * 0.12 + padding * j;
      s.price = random(priceFloor, priceCeiling);
      s.limit = random(priceFloor, priceFloor + limitAmount);
      sellers.push(s);
      s.show();
    }
  }

  //create buyers
  for (let i = Math.sqrt(size); i > 0; i--) {
    for (let j = 0; j < Math.sqrt(size); j++) {
      b = new Buyer();
      b.x = w * 0.75 - padding * i;
      b.y = h * 0.12 + padding * j;
      b.price = random(pMin, pMax);
      b.limit = random(pMax, pMax - limitAmount);
      buyers.push(b);
      b.show();
    }
  }

  transactedBuyerPricesFreeze = transactedBuyerPrices;
  transactedSellerPricesFreeze = transactedSellerPrices;
}

function draw() {
  if (!run) {
    background(0);
    for (let s of sellers) {
      s.show();
    }
    for (let b of buyers) {
      b.show();
    }
    graph2(transactedBuyerPricesFreeze, transactedSellerPricesFreeze);
    drawUtility();
    return;
  }

  document.getElementById("buyerSurplus").innerHTML = Math.round(
    totalBuyerSurplusFreeze
  );
  document.getElementById("totalTrans").innerHTML = totalTransactions;
  document.getElementById("dailyTrans").innerHTML = dailyTransactionFreeze;

  background(0);
  for (let s of sellers) {
    s.show();
  }
  for (let b of buyers) {
    b.show();
  }
  graph2(transactedBuyerPricesFreeze, transactedSellerPricesFreeze);
  if (transactionCount < transactionsPerDay) {
    index1 = Math.floor(Math.random() * sellers.length);
    index2 = Math.floor(Math.random() * buyers.length);
    transaction(sellers[index1], buyers[index2], index1, index2, true);
    transactionCount = transactionCount + 1;
  } else if (transactionCount === transactionsPerDay) {
    totalBuyerSurplusFreeze = totalBuyerSurplus;
    totalBuyerSurplus = 0;

    dailyTransactionFreeze = dailyTransactions;
    dailyTransactions = 0;

    buyerAvg = getAvgPrice(transactedBuyerPrices);
    sellerAvg = getAvgPrice(transactedSellerPrices);

    transactedBuyerPricesFreeze = transactedBuyerPrices;
    transactedSellerPricesFreeze = transactedSellerPrices;

    transactedSellerPrices = [];
    transactedBuyerPrices = [];

    sellers = sellers.concat(tempSellers);
    tempSellers = [];

    buyers = buyers.concat(tempBuyers);
    tempBuyers = [];

    numberDays = numberDays + 1;
    transactionCount = 0;
  }
  drawUtility();
}
