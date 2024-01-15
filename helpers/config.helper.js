const Log_Balance = require("../models/log_balance");
const User = require("../user-service/models/user.model");

async function getUser(id, row) {
  const user = await User.findOne({ _id: id });
  return user ? user[row] : null;
}

async function deductMoney(model, data, price, where) {
  return await model.updateOne(where, {
    $inc: { [data]: -price },
  });
}

async function incrementMoney(model, data, price, where) {
  return await model.updateOne(where, {
    $inc: { [data]: +price },
  });
}

exports.RemoveCredits = async (userID, price, reason) => {
  const moneyBefore = await getUser(userID, "money");
  await Log_Balance.create({
    money_before: moneyBefore,
    money_change: price,
    money_after: moneyBefore - price,
    content: reason,
    userID: userID,
  });

  const isRemove = await deductMoney(User, "money", price, { _id: userID });
  if (isRemove) {
    return true;
  } else {
    return false;
  }
};

exports.PlusCredits = async (userID, price, reason) => {
  const moneyBefore = await getUser(userID, "money");
  await Log_Balance.create({
    money_before: moneyBefore,
    money_change: price,
    money_after: moneyBefore + price,
    content: reason,
    userID: userID,
  });

  const isRemove = await incrementMoney(User, "money", price, { _id: userID });
  if (isRemove) {
    return true;
  } else {
    return false;
  }
};
