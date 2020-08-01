import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { setAlert } from "../../actions/alert";

const CreateList = ({ isAuthenticated, setAlert }) => {
  const [formData, setFormData] = useState({
    url: "",
  });

  if (!isAuthenticated) {
    return <Redirect to='/login'></Redirect>;
  }

  const { url } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setAlert("Success", "success");
    console.log("Hello");
  };
  return (
    <Fragment>
      <h1>Create a new list</h1>
      <p>Start by pasting in URLs of the book from Goodreads</p>

      <form className='form' onSubmit={onSubmit}>
        <div>
          <input
            type='url'
            placeholder='Paste a Goodreads URL'
            name='url'
            value={url}
            onChange={onChange}
          ></input>
        </div>
        <input type='submit' className='btn btn-primary' value='Add Book' />
      </form>
    </Fragment>
  );
};

CreateList.propTypes = {
  setAlert: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { setAlert })(CreateList);
