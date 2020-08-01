import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";

const Home = ({ isAuthenticated }) => {
  return (
    <Fragment>
      <h1>Book List Club is a place for creating and browsing book lists.</h1>
      <div className='buttons'>
        <Link to='/new' className='btn btn-primary'>
          New list
        </Link>
      </div>
      <p>Book list goes here</p>
      {/* <BookList /> */}
    </Fragment>
  );
};

Home.propTypes = {
  isAuthenticated: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, {})(Home);
