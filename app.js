const fs = require('fs/promises');
const rl = require('readline/promises').createInterface({
  input: process.stdin,
  output: process.stdout
});

function getAllIndices(array, value) {
  var indicies = [];
  for (let i = 0; i < array.length; i++)
    if (array[i] == value)
      indicies.push(i);
  return indicies;
}

function removeIndex(array, index) {
  return array.slice(0, index).concat(array.slice(index + 1));
}

function nLargestValues(array, n) {
  array.sort((a, b) => { return b.correlation - a.correlation });
  return array.slice(0, n);
}

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

function mean(array) {
  let filteredArr = array.filter((x) => { return x != -1 })
  return filteredArr.reduce((a, b) => a + b) / filteredArr.length;
}

function standardDev(array) {
  let filteredArr = array.filter((x) => { return x != -1 })
  let average = mean(filteredArr);
  return Math.sqrt(filteredArr.map(x => Math.pow(x - average, 2)).reduce((a, b) => a + b) / filteredArr.length);
}

function getSimilarity(user, users) {
  let similarities = [];
  for (let i = 0; i < users.length; i++) {
    let a = getCommonSet(user.ratings, users[i].ratings)[0];
    let b = getCommonSet(user.ratings, users[i].ratings)[1];

    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < a.length; j++) {
      numerator += (a[j] - mean(a)) * (b[j] - mean(b));
      denominator += standardDev(a) * standardDev(b);
    }
    if (denominator == 0) similarities.push({ user: users[i].user, ratings: users[i].ratings, correlation: 0 });
    else similarities.push({ user: users[i].user, ratings: users[i].ratings, correlation: numerator / denominator });
  }
  return similarities;
}

function getPrediction(user, unratedItems, correlations) {
  let prediction = user.ratings.slice(0);
  for (let i = 0; i < unratedItems.length; i++) {
    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < correlations.length; j++) {
      numerator += correlations[j].correlation * (correlations[j].ratings[unratedItems[i]] - mean(correlations[j].ratings));
      denominator += correlations[j].correlation;
    }
    prediction[unratedItems[i]] = mean(user.ratings) + (numerator / denominator);
  }
  return prediction
}

async function main() {
  try {
    let filePath = await rl.question('Enter path to input file: ');
    let neighbourhoodSize = await rl.question('Enter neighbourhood size: ');
    let inputFile = await fs.readFile(filePath);

    let inputFileArray = inputFile.toString().trim().split('\n');
    inputFileArray.forEach((cur, i, arr) => { arr[i] = cur.trim().split(' '); });

    let ratingsMatrix = inputFileArray.slice(3);
    ratingsMatrix.forEach((cur, i, arr) => { arr[i] = { user: i, ratings: cur.map(Number) }; });

    let completedMatrix = [];
    for (let i = 0; i < ratingsMatrix.length; i++) {
      if (ratingsMatrix[i].ratings.includes(-1)) {
        let unratedItems = getAllIndices(ratingsMatrix[i].ratings, -1);
        let correlations = getSimilarity(ratingsMatrix[i], removeIndex(ratingsMatrix, i));
        let prediction = getPrediction(ratingsMatrix[i], unratedItems, nLargestValues(correlations, neighbourhoodSize));
        completedMatrix.push(prediction);
      }
      else {
        completedMatrix.push(ratingsMatrix[i].ratings);
      }
    }

    console.log(inputFileArray.slice(0, 3).concat(completedMatrix))
    main();
  }
  catch (e) {
    console.log(e);
    main();
  }
}

main();