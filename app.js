const fs = require('fs/promises');
const rl = require('readline/promises').createInterface({
  input: process.stdin,
  output: process.stdout
});

function transposeMatrix(matrix) {
  return matrix[0].map((col, c) => matrix.map((row, r) => matrix[r][c]));
}

// removes a specified index from a given array
function removeIndex(arr, i) {
  return arr.slice(0, i).concat(arr.slice(i + 1));
}

// returns the n nearest neighbours
function getNearestNeighbours(arr, n) {
  arr.sort((a, b) => { return b.correlation - a.correlation });
  return arr.filter((x) => { return x.correlation > 0; }).slice(0, n);
}

// returns indices of array that match value
function getMatchingIndicies(arr, val) {
  var indicies = [];
  for (let i = 0; i < arr.length; i++)
    if (arr[i] == val)
      indicies.push(i);

  return indicies;
}

// returns the sets of items that both user a and b have rated
function getCommonSet(a, b) {
  let result = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] != -1 && b[i] != -1) result.push(i);
  }

  return result;
}

function mean(arr) {
  let filteredArr = arr.filter((x) => { return x != -1 });
  return filteredArr.reduce((a, b) => a + b) / filteredArr.length;
}

function getUserAverages(matrix) {
  let result = [];
  for (var i = 0; i < matrix.length; i++)
    result.push(mean(matrix[i]));
  return result;
}

// calculates sim(a, b) and returns an array of objects
function getSimilarity(item, items, userAverages) {
  let similarities = [];

  for (let i = 0; i < items.length; i++) {
    let commonSet = getCommonSet(item.ratings, items[i].ratings);

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    for (let j = 0; j < commonSet.length; j++) {
      numerator += (item.ratings[commonSet[j]] - userAverages[commonSet[j]]) * (items[i].ratings[commonSet[j]] - userAverages[commonSet[j]]);
      denominator1 += Math.pow((item.ratings[commonSet[j]] - userAverages[commonSet[j]]), 2);
      denominator2 += Math.pow((items[i].ratings[commonSet[j]] - userAverages[commonSet[j]]), 2);
    }

    let denominator = Math.sqrt(denominator1) * Math.sqrt(denominator2);
    let result = denominator != 0 ? numerator / denominator : 0;
    similarities.push({ item: items[i].item, ratings: items[i].ratings, correlation: result });
  }

  return similarities;
}

// calculates pred(a, p) and returns array with -1 values replaced with predicited value
function getPrediction(item, items) {
  let prediction = [...item.ratings];
  let unratedItems = getMatchingIndicies(prediction, -1);

  for (let i = 0; i < unratedItems.length; i++) {
    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < items.length; j++) {
      numerator += items[j].correlation * items[j].ratings[unratedItems[i]];
      denominator += items[j].correlation;
    }

    prediction[unratedItems[i]] = (numerator / denominator);
  }

  return prediction
}

async function main() {
  try {
    // prompting user for input file and neighbourhood size
    let filePath = await rl.question('Enter path to input file: ');
    let neighbourhoodSize = await rl.question('Enter neighbourhood size: ');
    let inputFile = await fs.readFile(filePath);

    // parsing the input file
    let inputFileArray = inputFile.toString().trim().split('\n');
    inputFileArray.forEach((cur, i, arr) => { arr[i] = cur.trim().split(' '); });

    let userMatrix = inputFileArray.slice(3);
    userMatrix.forEach((cur, i, arr) => { arr[i] = cur.map(Number); });

    let itemMatrix = transposeMatrix(inputFileArray.slice(3));
    itemMatrix.forEach((cur, i, arr) => { arr[i] = { item: i, ratings: cur.map(Number) }; });

    // iterating through ratings matrix and checking if an unrated product exists. If so, calculate the predicted rating...
    let completedMatrix = [];
    for (let i = 0; i < itemMatrix.length; i++) {
      if (itemMatrix[i].ratings.includes(-1)) {
        let similarity = getSimilarity(itemMatrix[i], removeIndex(itemMatrix, i), getUserAverages(userMatrix));
        let prediction = getPrediction(itemMatrix[i], getNearestNeighbours(similarity, neighbourhoodSize));

        completedMatrix.push(prediction);
      }
      else {
        completedMatrix.push(itemMatrix[i].ratings);
      }
    }

    // outputting completed matrix to console
    for (let x of transposeMatrix(completedMatrix)) console.log(...x);
    main();
  }
  catch (e) {
    console.log(e);
    main();
  }
}

main();