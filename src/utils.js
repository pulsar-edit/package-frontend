// Collection of utility functions for the frontend

async function displayError(req, res, errStatus) {
  switch(errStatus) {
    case 404:
      res.render('404');
      break;
    case 505:
      res.render('505');
      break;
    default:
      res.render('505');
      break;
  }
}

module.exports = {
  displayError,
};
