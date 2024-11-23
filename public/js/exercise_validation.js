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
    input = input.trim().toLowerCase();
    answer = answer.toLowerCase();
    return this.normalizeExpression(input) === this.normalizeExpression(answer);
  },

  normalizeExpression(expr) {
    return expr.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/");
  },
};


class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

class ExerciseNotFoundError extends Error {
  constructor(exerciseId) {
    super(`Exercise ${exerciseId} not found`);
    this.name = "ExerciseNotFoundError";
  }
}


const ErrorHandler = {
  handleApiError(error, exerciseId) {
    console.error("API Error:", error);
    if (error instanceof UnauthorizedError) {
      window.location.href = "/login";
      return;
    }
    this.showErrorMessage(
      exerciseId,
      "Error saving progress. Please try again."
    );
  },

  handleValidationError(exerciseId, error) {
    console.error("Validation Error:", error);
    if (error instanceof ExerciseNotFoundError) {
      this.showErrorMessage(
        exerciseId,
        "Exercise not found. Please refresh the page."
      );
      return;
    }
    this.showErrorMessage(exerciseId, "Incorrect. Try again!");
  },

  showErrorMessage(exerciseId, message) {
    document.getElementById(
      `feedback-${exerciseId}`
    ).innerHTML = `<div class="alert alert-danger">${message}</div>`;
  },
};

const UIManager = {
  addCompletionCheckmark(exerciseDiv) {
    const checkmark = document.createElement("div");
    checkmark.className = "position-absolute top-0 end-0 mt-2 me-2";
    checkmark.innerHTML =
      '<i class="fas fa-check-circle text-success" title="Completed"></i>';
    exerciseDiv.appendChild(checkmark);
  },

  showSuccess(exerciseId) {
    document.getElementById(`feedback-${exerciseId}`).innerHTML =
      '<div class="alert alert-success">Correct! Your progress has been saved.</div>';
  },

  disableForm(exerciseId) {
    const form = document.getElementById(`form-${exerciseId}`);
    form.querySelectorAll("input").forEach((el) => (el.disabled = true));
    form.querySelectorAll("button").forEach((btn) => {
      const buttonText = btn.textContent.trim();
      if (buttonText !== "Show Steps" && buttonText !== "Hide Steps") {
        btn.disabled = true;
      }
    });
  },

  markExerciseComplete(exerciseId) {
    const exerciseDiv = document
      .querySelector(`#form-${exerciseId}`)
      .closest(".exercise");
    if (exerciseDiv) {
      this.addCompletionCheckmark(exerciseDiv);
    }
  },

  disableShowAnswerButton(exerciseId) {
  const form = document.getElementById(`form-${exerciseId}`);
  if (!form) return;

  const buttons = form.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (btn.textContent.trim() === "Show Answer") {
      btn.disabled = true;
    }
  });
}
};

function validateAnswer(event, exerciseId, type) {
  event.preventDefault();
  let isCorrect = false;

  try {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) {
      throw new ExerciseNotFoundError(exerciseId);
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
  } catch (error) {
    ErrorHandler.handleValidationError(exerciseId, error);
  }
}

function handleExerciseResult(exerciseId, isCorrect) {
  if (isCorrect) {
    saveProgress(exerciseId);
  } else {
    ErrorHandler.showErrorMessage(exerciseId, "Incorrect. Try again!");
  }
}

function saveProgress(exerciseId) {
  const pathParts = window.location.pathname.split("/");
  const topicId = pathParts[2];

  fetch(`/topics/${topicId}/exercises/${exerciseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ exerciseId }),
  })
    .then((response) => {
      if (response.status === 401) {
        throw new UnauthorizedError();
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(() => {
      UIManager.showSuccess(exerciseId);
      UIManager.disableForm(exerciseId);
      UIManager.markExerciseComplete(exerciseId);
    })
    .catch((error) => ErrorHandler.handleApiError(error, exerciseId));
}

function toggleSteps(exerciseId) {
  const stepsElement = document.getElementById(`steps-${exerciseId}`);
  if (stepsElement) {
    stepsElement.classList.toggle("show");
    const button = event.target;
    button.textContent = stepsElement.classList.contains("show")
      ? "Hide Steps"
      : "Show Steps";
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
    UIManager.disableShowAnswerButton(exerciseId);
  }
}
