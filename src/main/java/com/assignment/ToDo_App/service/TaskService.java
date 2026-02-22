package com.assignment.ToDo_App.service;

import com.assignment.ToDo_App.dto.Response;
import com.assignment.ToDo_App.dto.TaskRequest;
import com.assignment.ToDo_App.entity.Task;

import java.util.List;

public interface TaskService {

    Response<Task> createTask(TaskRequest taskRequest);
    Response<List<Task>> getAllMyTasks();
    Response<Task> getTaskById(Long id);
    Response<Task> updateTask(TaskRequest taskRequest);
    Response<Void> deleteTask(Long id);
    Response<List<Task>> getMyTasksByCompletionStatus(boolean completed);
    Response<List<Task>> getMyTasksByPriority(String priority);
    Response<String> getDailyTaskSummary();
}
