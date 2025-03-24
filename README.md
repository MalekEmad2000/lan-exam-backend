# LAN Exam System Backend 


## Setup

1. Install dependencies
    
```bash
        $ npm install
```
2. create a `.env` file with the following content:
    
```bash
      POSTGRES_HOST='your_postgres_host'
      POSTGRES_DB='your_db_name
      POSTGRES_USER='your_db_user'
      POSTGRES_PASSWORD='your_db_password'
```
3. Create database.json file in root folder

4. Create database

```bash
        $ npm run db:create 'your_db_name'
```
5. Run migrations

```bash
        $ npm run db:migrate up
```
6. Run server (For development)

```bash
        $ npm run watch
```


## APIs
We have 2 servers running on 2 different ports



# 1- Local Host

## TODO APIs (check is done or not)

- [x] professor login
- [x] get all exams of professor (exam details without questions)
- [x] get single exam of professor (exam details without questions)
- [ ] get exam of professor (exam details with questions)
- [x] add exam
- [ ] update exam
- [ ] delete exam
- [x] create section for exam (with questions and choices)
- [ ] Update section add question to section of exam
- [ ] update question of section of exam
- [ ] delete question of section of exam
- [ ] get single section of exam with questions
- [ ] Add question to bank 

## Professor APIs
All requests should be associated with a token in the header except login
### Login


```bash
Request : 
    POST /professor/login
```
Request Body   
```json

    {
        "username": "",
        "password": ""
    }  
        OR
        
        {
                "email": "",
                "password": ""
        }
```

   
Response   
```json
On Success :
        {
         "status": "OK",
         "message": "Login Successful",
         "data": {
                  "profId": 1,
                  "user_name": "test",
                  "email": "",
                  "name": "test",
                  "token":"" (TODO LATER)
         }
        }
   

On Failiure
        {
         "status": "ERROR",
         "message": "Wrong username or password",
         
        }
```
### Get single professor exams

```bash
Request
    GET /professor/{prof_id}/exams/{exam_id}
```
```json
    Request Header
        Authorization: token
        No body in request

        Response
       
        {
        "status": "OK",
        "message": "Exam fetched successfully",
        "data":{

                "exam_id": 1,
                "exam_name": "test",
                        ....etc        
        }
        }
```


### Get all professor exams

```bash
Request
    GET /professor/{prof_id}/exams
```
```json
    Request Header
        Authorization: token
        No body in request

        Response
       
        {
        "status": "OK",
        "message": "Exams fetched successfully",
        "data":[
              
                        {
                        "exam_id": 1,
                        "exam_name": "test",
                         ....etc
                        },
                       ...all exams of professor  
                ]
        
        }
        
```
### Add exams 
Exam time should be in 24 hour format

```bash
Request
POST /exams/add
```
```json
Request Header

Authorization: token

{
    "name":"Networks Final 2023",
    "start_date":"2023-02-17",
    "start_time":"12:00",
    "end_time":"14:00",
    "exam_instructions":"Please enter your univeristy ID.",
    "min_submit_time":"05:00",
    "max_attempts":3
}
Response

{
    "status": "200 OK",
    "message": "Exam added successfully",
    "data": {
        "id": 1,
        "name": "exam 1",
        "start_date": "2023-01-01",
        "exam_instructions": "Please enter your univeristy ID.",
        "start_time": "04:00:00",
        "end_time": "06:00:00",
        "min_submit_time": "05:00:00",
        "max_attempts": 3,
        "professor_id": 1
    }
}
```

### Update exams 

```bash
Request 
        PUT /exams/update
```
```json
Request Header

Request Header
Authorization: token

{
        "exam_id": 1,
        "exam_name": "test",
        ....etc
}

Response 
{
        "status": "OK",
        "message": "Exam updated successfully",
        "data": {
                "exam_id": 1,
                "exam_name": "test",
                ....etc
        }
}
``` 

### Delete exams 

```bash
Request
        DELETE /exams/delete?exam_id=id
```
```json
Request Header
Authorization: token
No body in request

Response 
On Success
{
        "status": "OK",
        "message": "Exam deleted successfully",
        "data": {
                "exam_id": 1,
                "exam_name": "test",
                ....etc
        }
}

On Failiure
{
        "status": "FAIL",
        "message": "Exam not found"
}
```

### Create new section for exam (with questions and choices)

```bash
Request
        POST /exams/sections/add
```


```json
Request Header
Authorization: token
body : 
{
  "section_title" : "Section 1",
  "random_shuffle":true,
  "questions" : [
      {
      "question_text":"What is your name ?",
      "weight" : 1,
      "choices": [
          {
              "choice_text" : "Omar",
              "is_correct":true
          },
           {
              "choice_text" : "Ahmed",
              "is_correct":false
          }
      ]
      }
  ]
}
```

Response 

```json
On Success :
{
    "status": "200 OK",
    "message": "Section added successfully",
    "data": {
        "exam_id": 1,
        "section_id": 19,
        "random_shuffle": true,
        "section_title": "Section 1",
        "questions": [
            {
                "id": 7,
                "question_text": "What is your name ?",
                "diagram": null,
                "professor_id": 1,
                "weight": 1,
                "choices": [
                    {
                        "question_id": 7,
                        "choice_text": "Omar",
                        "choice_id": 2,
                        "is_correct": true
                    },
                    {
                        "question_id": 7,
                        "choice_text": "Ahmed",
                        "choice_id": 3,
                        "is_correct": false
                    }
                ]
            }
        ]
    }
}
On Failiure
{
        "status": "FAIL",
        "message": "An error occurred while adding section"
}
```

### Add questions to section in exam

```bash
Request
        POST /exams/questions/add
```
Request
```json 
 Header
Authorization: token
body : 
{
        "exam_id": 1,
        "section_id": 1,
        "questions": [
                "question_text": "test",....etc(data of questions)
                "answers": [
                        {
                                "answer": "test",
                                "is_correct": true
                        },
                        {
                                "answer": "test",
                                "is_correct": false
                        }
                        ]
        
        ]
                
        }

```
Response 
```json
On Success
{
        "status": "OK",
        "message": "Questions added successfully",
        "exam_id": 1,
        "section_id": 1,
        "questions": [
                "question_text": "test",....etc(data of questions)
                "answers": [
                        {
                                "answer": "test",
                                "is_correct": true
                        },
                        {
                                "answer": "test",
                                "is_correct": false
                        }
                        ]
        
        ]
                
        }
On Failiure
{
        "status": "FAIL",
        "message": "Exam not found"
}
```

### Update questions in section in exam

```bash
Request
        PUT /exams/questions/update
```
Request
```json 
 Header
Authorization: token

body : 
{
        "exam_id": 1,
        "section_id": 1,
        "question_id": 1,
        "question": {
                "question_id": 1,
                "question_text": "test",....etc(data of questions)
                "answers": [
                        {
                                "answer_id": 1,
                                "answer": "test",
                                "is_correct": true
                        },
                        {
                                "answer_id": 2,
                                "answer": "test",
                                "is_correct": false
                        }
                        ]
        }
        
                
        }

```

Response 
```json
On Success
{
        "status": "OK",
        "message": "Question updated successfully",
        "exam_id": 1,
        "section_id": 1,
        "question_id": 1,
        "question": {
                "question_id": 1,
                "question_text": "test",....etc(data of questions)
                "answers": [
                        {
                                "answer_id": 1,
                                "answer": "test",
                                "is_correct": true
                        },
                        {
                                "answer_id": 2,
                                "answer": "test",
                                "is_correct": false
                        }
                        ]
        }
        
                
        }
On Failiure
{
        "status": "FAIL",
        "message": "Exam not found"
}
```

### CRUD operations on questions for question bank

```bash
Request
        POST /questions/add
```
Request
```json 
 Header
Authorization: token

body : 
{
        "question_text": "test",....etc(data of questions)
        "answers": [
                {
                        "answer": "test",
                        "is_correct": true
                },
                {
                        "answer": "test",
                        "is_correct": false
                }
                ]
        
                
        }

```

### Exam results statistics (TODO)

### student exam answers and results (TODO)




# 2 - public IP APIs

### Login to exam
check if exam already started or not
Create or update student

Insert all answers in student answer table

```bash
Request
        POST /exams/login?exam_id=1
```
Request
```json 
 Header
Authorization: token (TODO : not now)
body : 
{
        "exam_id": 1,
        "student_id": 1,
        "student_name": "test", ",....etc(data of student)
}
```

Response 
```json

On Success
{
        "status": "OK",
        "message": "Student added successfully",
        "student_id": 1,
        "student_name": "test", ",....etc(data of student)"
}

On Failiure
{
        "status": "FAIL",
        "message": "Student not found"
}
```

### Get exam details questions and choices


```bash
Request
        GET /exams/details?exam_id=1
```
Request
```json 
 Header
 Authorization: token (TODO : not now)
No body

Response 
```json
{
        "exam_id": 1,
        "exam_name": "test",....etc(data of exam)
        "questions": [
                
                        "question_id": 1,
                        "question_text": "test",....etc(data of questions)
                        "choices": [
                                {
                                        "choice_id": 1,
                                        "choice_text": "test"
                                },
                                {
                                        "choice_id": 2,
                                        "choice_text": "test"
                                }
                                ]
                                
                                
        ],
              
                
        }
}
```

### Submit all exam

```bash
Request
        POST /exams/submit_exam?exam_id=1
```

Request
```json 
 Header
authorization: exam token (TODO : not now)

body : 
{
        "exam_id": 1,
        "student_id": 1,
        "answers": [
                {
                        "question_id": 1,
                        "choice_id": 1
                },
                {
                        "question_id": 2,
                        "choice_id": 2
                }
                ]
        
                
        }

```

Response 
```json

On Success
{
        "status": "OK",
        "message": "Exam submitted successfully",
        "exam_id": 1,
        "student_id": 1,
        "score": 2
        "total_questions": 10,
        "total_correct": 2,
        "total_incorrect": 8,
        "total_unanswered": 0
        "total_answered": 10        
}

On Failiure
{
        "status": "FAIL",
        "message": "Exam not found"
}
```

### submit single question

```bash
Request
        POST /exams/submit_question?exam_id=1
```

Request
```json 
 Header
 Authorization: exam token (TODO : not now)

body :
{
        "exam_id": 1,
        "student_id": 1,
        "question_id": 1,
        "choice_id": 1
}
```

Response 
```json

On Success
{
        "status": "OK",
        "message": "Question submitted successfully",
        "exam_id": 1,
        "student_id": 1,
        "question_id": 1,
        "choice_id": 1
}

On Failiure
{
        "status": "FAIL",
        "message": "Exam not found"
}
```

### Courses API

### Get all courses

```bash
Request
        GET /courses
```
### add course

```bash
Request
        POST /courses/add
```
Request
```json 
 {
    "course_id" : "CC552",
    "course_name" : "Networks"
}
```






