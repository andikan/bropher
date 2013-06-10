/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('main/index');
};


exports.mapper = function(req, res){
  res.render('main/mapper');
};