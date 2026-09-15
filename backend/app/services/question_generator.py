from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.prompts import PromptTemplate

    
import os

class QuestionGeneratorService:

    def __init__(self):
        if os.getenv("GROQ_API_KEY"):
            from langchain_groq import ChatGroq
            self.llm = ChatGroq(model="groq/compound", temperature=0)
        else:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)



    def generate_questions(self,topic,documents):
        context="\n\n".join([doc.page_content for doc in documents])




        prompt=PromptTemplate.from_template(
            """
           You are an interview preparation assistant.

            Use ONLY the following context.

            Context:
            {context}

            Generate interview questions about:

            {topic}
           

Using ONLY the provided context, generate exactly 10 interview questions.

Rules:
- Do not include introductions.
- Do not include headings.
- Do not include markdown.
- Do not include "Expected Answer".
- Return only the list of questions.
- Number them from 1 to 10.
            
             """
            )


        chain =  prompt | self.llm 
            
        return chain.invoke(
                {
                    "topic":topic,
                    "context":context
                }
             )

        



          

        
