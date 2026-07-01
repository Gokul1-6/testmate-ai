# Gappy AI Hackathon Submission Draft

## Project Name
TestMate AI – Agentic JavaScript Testing Assistant

## Problem Statement
Developers spend a lot of time manually writing test cases, running them, and understanding failures. Many student and small-team projects are shipped without proper testing because test creation is time-consuming and difficult for beginners. This leads to hidden bugs, poor code quality, and slow development.

## Product Description
TestMate AI is an agentic JavaScript testing assistant that helps developers generate, run, and understand test cases automatically. Users can paste JavaScript code, and the system analyzes the code, creates meaningful test cases, runs them using Node.js testing tools, and explains pass/fail results in simple language. It reduces manual testing effort, helps beginners understand bugs faster, and improves code reliability before deployment.

## How Lemma SDK Is Used
We designed TestMate AI as a Lemma-powered agentic workflow. The agent receives JavaScript code, analyzes functions, plans suitable tests, generates a test file, triggers the test runner, reads the execution output, and returns a structured report with pass/fail status and bug explanations. This converts a normal test runner into a multi-step agentic developer assistant.

## External Tools / Models / APIs
Node.js, Express.js, React.js, Vite, node:test, test-extras. Optional future integration: Gemini API for more advanced test generation and explanation.

## Demo Script
Hi, this is TestMate AI, an agentic JavaScript testing assistant. Developers often skip testing because writing test cases manually takes time. In our product, the user pastes JavaScript code, the agentic workflow analyzes it, generates test cases, runs them using Node.js tools, and shows a simple pass/fail report with bug explanations. This helps developers find bugs faster and improve code quality before deployment.
