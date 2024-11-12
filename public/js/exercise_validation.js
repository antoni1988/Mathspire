const ExerciseValidator = {
  validateMultipleChoice(selected, answer) {
    // Safely handle undefined values and convert to strings
    if (!selected) return false;
    const selectedValue = selected.value;
    const correctAnswer = String(answer); // Convert answer to string
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

  // Find exercise by ID from the global exercises array
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
  fetch(`/topics/3/exercises/${exerciseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(() => {
      showSuccess(exerciseId);
      disableForm(exerciseId);
    })
    .catch((error) => {
      console.error("Error:", error);
      showError(exerciseId, "Error saving progress. Please try again.");
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
