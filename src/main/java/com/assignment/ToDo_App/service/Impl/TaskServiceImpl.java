package com.assignment.ToDo_App.service.Impl;

import com.assignment.ToDo_App.dto.Response;
import com.assignment.ToDo_App.dto.TaskRequest;
import com.assignment.ToDo_App.entity.Task;
import com.assignment.ToDo_App.entity.User;
import com.assignment.ToDo_App.enums.Priority;
import com.assignment.ToDo_App.exceptions.NotFoundException;
import com.assignment.ToDo_App.repo.TaskRepository;
import com.assignment.ToDo_App.service.TaskService;
import com.assignment.ToDo_App.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.HashMap;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    @Value("${groq.api.key}")
    private String groqApiKey;
    private final UserService userService;



    @Override
    public Response<Task> createTask(TaskRequest taskRequest) {

        log.info("INSIDE createTask()");

        User user = userService.getCurrentLoggedInUser();

        Task taskToSave = Task.builder()
                .title(taskRequest.getTitle())
                .description(taskRequest.getDescription())
                .completed(taskRequest.getCompleted())
                .priority(taskRequest.getPriority())
                .dueDate(taskRequest.getDueDate())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .user(user)
                .build();

        Task savedTask = taskRepository.save(taskToSave);

        return Response.<Task>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Task Created Successfully")
                .data(savedTask)
                .build();

    }

    @Override
    @Transactional
    public Response<List<Task>> getAllMyTasks() {
        log.info("inside getAllMyTasks()");
        User currentUser = userService.getCurrentLoggedInUser();

        List<Task> tasks = taskRepository.findByUser(currentUser, Sort.by(Sort.Direction.DESC, "id"));

        return Response.<List<Task>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tasks retrieved successfully")
                .data(tasks)
                .build();
    }

    @Override
    public Response<Task> getTaskById(Long id) {
        log.info("inside getTaskById()");

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tasks not found"));

        return Response.<Task>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Task retrieved successfully")
                .data(task)
                .build();
    }

    @Override
    public Response<Task> updateTask(TaskRequest taskRequest) {
        log.info("inside updateTask()");

        Task task = taskRepository.findById(taskRequest.getId())
                .orElseThrow(() -> new NotFoundException("Tasks not found"));

        if (taskRequest.getTitle() != null) task.setTitle(taskRequest.getTitle());
        if (taskRequest.getDescription() != null) task.setDescription(taskRequest.getDescription());
        if (taskRequest.getCompleted() != null) task.setCompleted(taskRequest.getCompleted());
        if (taskRequest.getPriority() != null) task.setPriority(taskRequest.getPriority());
        if (taskRequest.getDueDate() != null) task.setDueDate(taskRequest.getDueDate());
        task.setUpdatedAt(LocalDateTime.now());

        //update the task in the database
        Task updatedTask = taskRepository.save(task);

        return Response.<Task>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Task updated successfully")
                .data(updatedTask)
                .build();


    }

    @Override
    public Response<Void> deleteTask(Long id) {
        log.info("inside delete task");
        if (!taskRepository.existsById(id)) {
            throw new NotFoundException("Task does not exists");
        }
        taskRepository.deleteById(id);

        return Response.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("task deleted successfully")
                .build();
    }

    @Override
    @Transactional
    public Response<List<Task>> getMyTasksByCompletionStatus(boolean completed) {
        log.info("inside getMyTasksByCompletionStatus()");

        User currentUser = userService.getCurrentLoggedInUser();

        List<Task> tasks = taskRepository.findByCompletedAndUser(completed, currentUser);

        return Response.<List<Task>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tasks filtered by completion status for user")
                .data(tasks)
                .build();

    }

    @Override
    public Response<List<Task>> getMyTasksByPriority(String priority) {
        log.info("inside getMyTasksByPriority()");

        User currentUser = userService.getCurrentLoggedInUser();

        Priority priorityEnum = Priority.valueOf(priority.toUpperCase());

        List<Task> tasks = taskRepository.
                findByPriorityAndUser(priorityEnum, currentUser, Sort.by(Sort.Direction.DESC, "id"));

        return Response.<List<Task>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Tasks filtered by priority for user")
                .data(tasks)
                .build();

    }

    @Override
    @Transactional
    public Response<String> getDailyTaskSummary() {
        log.info("inside getDailyTaskSummary()");

        User currentUser = userService.getCurrentLoggedInUser();

        // 1. Fetch only COMPLETED tasks for the user
        List<Task> completedTasks = taskRepository.findByCompletedAndUser(true, currentUser);

        if (completedTasks.isEmpty()) {
            return Response.<String>builder()
                    .statusCode(HttpStatus.OK.value())
                    .message("No completed tasks to summarize.")
                    .data("You haven't completed any tasks yet today. Get to work!")
                    .build();
        }

        // 2. Build the prompt for the AI
        StringBuilder prompt = new StringBuilder("I have completed the following tasks today. Please provide a short, encouraging 2-sentence summary of my productivity praising my work:\n");
        for (Task task : completedTasks) {
            prompt.append("- ").append(task.getTitle()).append(": ").append(task.getDescription() != null ? task.getDescription() : "No description").append("\n");
        }

        // 3. Call Groq API using RestTemplate
        RestTemplate restTemplate = new RestTemplate();
        String groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        // Build the JSON payload for Groq (Using LLaMA 3 model)
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");

        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt.toString());

        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            // Send the request
            String responseJson = restTemplate.postForObject(groqApiUrl, request, String.class);

            // Extract the AI's message from the JSON response
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(responseJson);
            String aiSummary = rootNode.path("choices").get(0).path("message").path("content").asText();

            return Response.<String>builder()
                    .statusCode(HttpStatus.OK.value())
                    .message("AI Summary Generated")
                    .data(aiSummary)
                    .build();

        } catch (Exception e) {
            log.error("Failed to generate AI summary: ", e);
            return Response.<String>builder()
                    .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Error contacting AI Service")
                    .data("Failed to generate summary at this time.")
                    .build();
        }
    }
}
