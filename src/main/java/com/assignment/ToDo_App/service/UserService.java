package com.assignment.ToDo_App.service;

import com.assignment.ToDo_App.dto.Response;
import com.assignment.ToDo_App.dto.UserRequest;
import com.assignment.ToDo_App.entity.User;


public interface UserService {

    Response<?> signUp(UserRequest userRequest);
    Response<?> login(UserRequest userRequest);
    User getCurrentLoggedInUser();

}
