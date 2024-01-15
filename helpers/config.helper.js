const User = require("../models/user.model");

async function getUser(id, row) {
  const user = await User.findOne({ _id: id });
  return user ? user[row] : null;
}

async function deductMoney(model, data, price, where) {
  const currentData = await model.findOne(where);

  if (currentData) {
    const newMoney = currentData[data] - parseInt(price);

    return await model.updateOne(where, {
      $set: { [data]: newMoney },
    });
  } else {
    throw new Error("Document not found.");
  }
}

async function incrementMoney(model, data, price, where) {
  const currentData = await model.findOne(where);

  if (currentData) {
    const newMoney = currentData[data] + parseInt(price);
    return await model.updateOne(where, {
      $set: { money: newMoney },
    });
  } else {
    throw new Error("Document not found.");
  }
}

exports.RemoveCredits = async (userID, price) => {
  const isRemove = await deductMoney(User, "money", price, { _id: userID });
  if (isRemove) {
    return true;
  } else {
    return false;
  }
};

exports.PlusCredits = async (userID, price) => {
  const isRemove = await incrementMoney(User, "money", price, { _id: userID });
  if (isRemove) {
    return true;
  } else {
    return false;
  }
};
