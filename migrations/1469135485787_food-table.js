exports.up = function(pgm) {
  columns = {
    id: {
      type: "serial",
      primaryKey: true,
      unique: true
    },
    "name": {
      type: "string",
      notNull: true
    },
    "author": {
      type: "string",
      notNull: true
    },
    "rating": {
      type: "integer",
      notNull: true
    },
    "category": {
      type: "string",
      notNull: true
    }
  }
  pgm.createTable('food', columns)
};

exports.down = function(pgm) {
  pgm.dropTable('food')
};
