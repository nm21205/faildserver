//commonJs문법
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
      name: {
        type:DataTypes.STRING(20),
        allowNull: false,
      },
      price: {
        type:DataTypes.INTEGER(10),
        allowNull: true,
      },
      seller: {
        type:DataTypes.STRING(20),
        allowNull: true,
      },
      description: {
        type:DataTypes.STRING(200),
        allowNull: false,
      },
      imageUrl: {
        type:DataTypes.STRING(200),
        allowNull: true,
      },
  }, {
    tableName: 'products',
  });
  return Product
}