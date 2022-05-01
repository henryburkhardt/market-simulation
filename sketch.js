//simulation controls
let run = false;

//storage arrays
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
const pMin = 20;
const pMax = 30;
const limitAmount = 1;
let buyerAvg;
let sellerAvg;
const classes = 10;

//time tracking
const transactionsPerDay = 50;
let transactionCount = 0;
let numberDays = 0;

//sellers are red, buyer are blue
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

function transaction(seller, buyer, i1, i2, showStatus) {
  push();
  strokeWeight(4);
  stroke(255);
  if (showStatus) {
    line(buyer.x, buyer.y, seller.x, seller.y);
  }
  pop();

  //transaction occurs:
  //  (1) reduce buyer price,
  //  (2) increase seller price,
  if (buyer.price >= seller.price) {
    transactedSellerPrices.push(seller.price);
    transactedBuyerPrices.push(buyer.price);

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
    const newSellerPrice = random(pMin, seller.price);
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

  //regardless of transaction status, remove from current arrays and place in temp storage
  tempBuyers.push(buyer);
  tempSellers.push(seller);
  sellers.splice(i1, 1);
  buyers.splice(i2, 1);
}

function setRun(status) {
  run = status;
  return;
}
function getAvgPrice(array) {
  let total = 0;
  for (let a of array) {
    total = total + a.price;
  }
  return total / array.length;
}

function graph(buyers, sellers) {
  let xOrgin = w / 2 - 200;
  let yOrigin = h * 0.8 + 100;
  let xMax = w / 2 + 200;
  let yMax = h * 0.8 - 100;

  let bPoints = [];
  let sPoints = [];
  for (let i = 0; i < classes; i++) {
    bPoints[i] = [0, i / classes];
    sPoints[i] = [0, i / classes];
  }
  let classRange = (pMax - pMin) / classes;

  for (let b of buyers) {
    for (let i = 0; i < classes; i++) {
      if (b < classRange * i + pMin && b > classRange * (i - 1) + pMin) {
        let old = bPoints[i][0];
        bPoints[i] = [old + 1, i / classes];
      }
    }
  }

  for (let s of sellers) {
    for (let i = 0; i < 10; i++) {
      if (s < classRange * i + pMin && s > classRange * (i - 1) + pMin) {
        let old = sPoints[i][0];
        sPoints[i] = [old + 1, i / classes];
      }
    }
  }

  push();
  rectMode(CENTER);
  stroke(255, 0, 0);
  strokeWeight(2);
  fill(0);
  stroke(255);
  rect(w / 2, h * 0.8, 400, 200);
  noStroke();
  fill(255, 255, 255);
  textSize(15);
  text("Price", w / 2, h * 0.9 + 12);
  textAlign(RIGHT);
  text("Quantity", w / 2 - 200, h * 0.9 - 100);
  pop();

  push();
  strokeWeight(5);
  stroke(52, 110, 235);
  let prevX;
  let prevY;
  for (let p of bPoints) {
    let curY = (p[0] / size) * -1500 + yOrigin;
    let curX = xOrgin + p[1] * 400;

    point(curX, curY);
    line(prevX, prevY, curX, curY);
    push();
    strokeWeight(0);
    textSize(10);
    // text(p[1] * pMax, curX, curY);
    prevX = curX;
    prevY = curY;
    pop();
  }
  prevX = xOrgin;
  prevY = yOrigin;
  stroke(235, 64, 52);
  for (let p of sPoints) {
    let curY = (p[0] / size) * -1500 + yOrigin;
    let curX = xOrgin + p[1] * 400;

    point(curX, curY);
    line(prevX, prevY, curX, curY);
    prevX = curX;
    prevY = curY;

    push();
    noStroke();

    pop();
  }

  pop();
}

function setup() {
  w = windowWidth;
  h = windowHeight;
  createCanvas(w, h);

  //create sellers
  for (let i = 0; i < Math.sqrt(size); i++) {
    for (let j = 0; j < Math.sqrt(size); j++) {
      s = new Seller();
      s.x = w * 0.25 + padding * i;
      s.y = h * 0.25 + padding * j;
      s.price = random(pMin, pMax);
      s.limit = random(pMin, pMin + limitAmount);
      sellers.push(s);
      s.show();
    }
  }

  //create buyers
  for (let i = Math.sqrt(size); i > 0; i--) {
    for (let j = 0; j < Math.sqrt(size); j++) {
      b = new Buyer();
      b.x = w * 0.75 - padding * i;
      b.y = h * 0.25 + padding * j;
      b.price = random(pMin, pMax);
      b.limit = random(pMax, pMax - limitAmount);
      buyers.push(b);
      b.show();
    }
  }
}

function draw() {
  if (!run) {
    return;
  }
  background(0);
  for (let s of sellers) {
    s.show();
  }
  for (let b of buyers) {
    b.show();
  }
  graph(transactedBuyerPricesFreeze, transactedSellerPricesFreeze);
  if (transactionCount < transactionsPerDay) {
    index1 = Math.floor(Math.random() * sellers.length);
    index2 = Math.floor(Math.random() * buyers.length);
    transaction(sellers[index1], buyers[index2], index1, index2, true);
    transactionCount = transactionCount + 1;
  } else if (transactionCount === transactionsPerDay) {
    buyerAvg = getAvgPrice(buyers);
    sellerAvg = getAvgPrice(sellers);

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
}
