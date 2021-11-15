const fs = require('fs/promises');
const rl = require('readline/promises').createInterface({
  input: process.stdin,
  output: process.stdout
});

function transposeMatrix(matrix) {
  return matrix[0].map((col, c) => matrix.map((row, r) => matrix[r][c]));
}

// returns indices of array that match value
function getMatchingIndicies(arr, val) {
  var indicies = [];
  for (let i = 0; i < arr.length; i++)
    if (arr[i] == val)
      indicies.push(i);

  return indicies;
}

// removes a specified index from a given array
function removeIndex(arr, i) {
  return arr.slice(0, i).concat(arr.slice(i + 1));
}

// returns the n largest values of an array
function nLargestValues(arr, n) {
  arr.sort((a, b) => { return b.correlation - a.correlation });
  return arr.slice(0, n);
}

// returns the sets of items that both user a and b have rated
function getCommonSet(a, b) {
  let setA = [];
  let setB = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] != -1 && b[i] != -1) {
      setA.push(a[i]);
      setB.push(b[i]);
    }
  }

  return [setA, setB];
}

function mean(arr) {
  let filteredArr = arr.filter((x) => { return x != -1 })
  return filteredArr.reduce((a, b) => a + b) / filteredArr.length;
}

function standardDev(arr) {
  let filteredArr = arr.filter((x) => { return x != -1 })
  let average = mean(filteredArr);
  return Math.sqrt(filteredArr.map(x => Math.pow(x - average, 2)).reduce((a, b) => a + b) / filteredArr.length);
}

// calculates sim(a, b) and returns an array of objects
function getSimilarity(item, items) {
  let similarities = [];
  for (let i = 0; i < items.length; i++) {
    let commonSet = getCommonSet(item.ratings, items[i].ratings);
    let a = commonSet[0];
    let b = commonSet[1];

    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < a.length; j++) {
      numerator += (a[j] - mean(a)) * (b[j] - mean(b));
      denominator += standardDev(a) * standardDev(b);
    }

    if (denominator == 0) similarities.push({ item: items[i].item, ratings: items[i].ratings, correlation: 0 });
    else similarities.push({ item: items[i].item, ratings: items[i].ratings, correlation: numerator / denominator });
  }

  return similarities;
}

// calculates pred(a, p) and returns array with -1 values replaced with predicited value
function getPrediction(item, items, unratedEntries) {
  let prediction = [...item.ratings];

  for (let i = 0; i < unratedEntries.length; i++) {
    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < items.length; j++) {
      numerator += items[j].correlation * items[j].ratings[unratedEntries[i]];
      denominator += items[j].correlation;
    }
    prediction[unratedEntries[i]] = numerator / denominator;
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

    // further parsing the input file by extracting user ratings and creating an array of objects
    let ratingsMatrix = transposeMatrix(inputFileArray.slice(3));
    ratingsMatrix.forEach((cur, i, arr) => { arr[i] = { item: i, ratings: cur.map(Number) }; });

    // iterating through ratings matrix and checking if an unrated product exists. If so, calculate the predicted rating...
    let completedMatrix = [];
    for (let i = 0; i < ratingsMatrix.length; i++) {
      if (ratingsMatrix[i].ratings.includes(-1)) {
        let correlations = getSimilarity(ratingsMatrix[i], removeIndex(ratingsMatrix, i));
        let prediction = getPrediction(ratingsMatrix[i], nLargestValues(correlations, neighbourhoodSize), getMatchingIndicies(ratingsMatrix[i].ratings, -1));

        completedMatrix.push(prediction);
      }
      else {
        completedMatrix.push(ratingsMatrix[i].ratings);
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