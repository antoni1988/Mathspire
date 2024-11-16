const ExerciseValidator = {
  validateMultipleChoice(selected, answer) {
    if (!selected) return false;
    const selectedValue = selected.value;
    const correctAnswer = String(answer);
    return selectedValue === correctAnswer;
  },

  validateTrueFalse(selections, statements) {
    return statements.every((statement, index) => {
      const selected = selections[index];
      return selected && (selected.value === "true") === statement.answer;
    });
  },

  validateOpen(input, answer) {
    return input.trim().toLowerCase() === answer.toLowerCase();
  },
};

function validateAnswer(event, exerciseId, type) {
  event.preventDefault();
  let isCorrect = false;
  const exercise = exercises.find((ex) => ex.id === exerciseId);
  if (!exercise) {
    console.error(`Exercise ${exerciseId} not found`);
    return;
  }

  switch (type) {
    case "multiple_choice":
      const selected = document.querySelector(
        `input[name="answer-${exerciseId}"]:checked`
      );
      isCorrect = ExerciseValidator.validateMultipleChoice(
        selected,
        exercise.answer
      );
      break;

    case "true_false":
      const selections = exercise.statements.map((_, index) =>
        document.querySelector(
          `input[name="answer-${exerciseId}-${index}"]:checked`
        )
      );
      isCorrect = ExerciseValidator.validateTrueFalse(
        selections,
        exercise.statements
      );
      break;

    case "open_question":
      const answer = document.getElementById(`answer-${exerciseId}`).value;
      isCorrect = ExerciseValidator.validateOpen(answer, exercise.answer);
      break;
  }

  handleExerciseResult(exerciseId, isCorrect);
}

function handleExerciseResult(exerciseId, isCorrect) {
  if (isCorrect) {
    saveProgress(exerciseId);
  } else {
    showError(exerciseId);
  }
}

function saveProgress(exerciseId) {
  const pathParts = window.location.pathname.split("/");
  const topicId = pathParts[2];

  fetch(`/topics/${topicId}/exercises/${exerciseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin", // Important for session cookies
    body: JSON.stringify({ exerciseId }),
  })
    .then((response) => {
      if (response.status === 401) {
        window.location.href = "/login"; // Redirect to login if unauthorized
        throw new Error("Unauthorized");
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(() => {
      showSuccess(exerciseId);
      disableForm(exerciseId);
      const exerciseDiv = document
        .querySelector(`#form-${exerciseId}`)
        .closest(".exercise");
      if (exerciseDiv) {
        const checkmark = document.createElement("div");
        checkmark.className = "position-absolute top-0 end-0 mt-2 me-2";
        checkmark.innerHTML =
          '<i class="fas fa-check-circle text-success" title="Completed"></i>';
        exerciseDiv.appendChild(checkmark);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      if (error.message !== "Unauthorized") {
        showError(exerciseId, "Error saving progress. Please try again.");
      }
    });
}

function showSuccess(exerciseId) {
  document.getElementById(`feedback-${exerciseId}`).innerHTML =
    '<div class="alert alert-success">Correct! Your progress has been saved.</div>';
}

function showError(exerciseId, message = "Incorrect. Try again!") {
  document.getElementById(
    `feedback-${exerciseId}`
  ).innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function disableForm(exerciseId) {
  document
    .getElementById(`form-${exerciseId}`)
    .querySelectorAll("input, button")
    .forEach((el) => (el.disabled = true));
}

function toggleSteps(exerciseId) {
  const stepsElement = document.getElementById(`steps-${exerciseId}`);
  if (stepsElement) {
    stepsElement.classList.toggle('show');
    const button = event.target;
    button.textContent = stepsElement.classList.contains('show') ? 'Hide Steps' : 'Show Steps';
  }
}


function showAnswer(exerciseId) {
  const exercise = exercises.find((ex) => ex.id === exerciseId);
  if (exercise && exercise.type === "open_question") {
    const feedback = document.getElementById(`feedback-${exerciseId}`);
    feedback.innerHTML = `
      <div class="alert alert-info">
        <strong>Answer:</strong> ${exercise.answer}
      </div>
    `;
    disableShowAnswerButton(exerciseId);
  }
}

function disableShowAnswerButton(exerciseId) {
  const form = document.getElementById(`form-${exerciseId}`);
  if (!form) return;

  const buttons = form.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (btn.textContent.trim() === "Show Answer") {
      btn.disabled = true;
    }
  });
}
