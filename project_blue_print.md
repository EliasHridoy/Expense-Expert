#Name: Expense Expert

#Description: Expense Expert is a web application that helps users track their expenses and income. It provides a simple and intuitive interface for users to manage their finances. It also provides insights and analytics to help users make informed decisions about their spending habits.

# Tech Stack:
- Frontend: Angular
- Database: Firebase
- Backend: Firebase
- UI: Tailwind CSS

#Features:
1. User Authentication: Users can create an account and log in to the application.
2. Dashboard: Users can view their expenses and income in a dashboard. The dashboard should display the total expenses and income for the current month. It should also display a chart showing the expenses and income for the past 6 months.
3. Expense Tracking: Users can add, edit, and delete expenses. Each expense should have a title, description, amount, and category. The category should be a dropdown with the following options: Food, Transport, Entertainment, Utilities, and Other.
4. Expense Draft: User can have some fixed expense like: house rent, wifi bill, electricity bill, donation, investment etc (user can add custom category. there will be small add button besides category). User can create a draft expense and reuse it in every month. as a result user can see how much expense he has and how much will remain.
    - Targeted amount to pay can be paid by installment. like: electricity bill's target 3K. User can pay 1K on 1st, 1K on 2nd step, 1K on 3rd step.
    - Expense can be for giving load to some one. For giving load, it's an expense for that month. Also later user can see how much he has pending loan to be clear. user can add person name to track the loan.
    - person name will be loaded in dropdown and small button to add person name if not in the list.
    - given loan can be paid by the person, so need a option to enter the amount which will be deduct from person loan amount

5. saving strategy: User can add bank account number and save money for various purpose per month. f.ex: can save 2k for shopping, 3k for travel, 200 for donate later. And user can see list for saved money purpose wise.
    - Also user can reduce savings amount if he want. may be he can use some amount from the savings.
    - Savings is also an expense from the current months total earning. you can mark as expnse for each savings if it's user friendly.
6. Need a user profile option where user can add his current salary or monthly income or salary and any earnings through out the months.
7. In dashboard and in expense page show the remaining amount
8. While creating new expense Category user should able to choose icon for that perticual category.
9. giving loan is one kind of savings, so it should be in savings page. Add card where it will show total amount of loan pending to pay. By clicking that card user can see list of loans and make changes.
10. Now for new user, I like to add guide for using the app. Like a small tour of the app. for example: after marking a expense as Loan where user can find out. "You have given loan to someone. Now you can track it in the savings page. Click on the savings page to see the loan details."
 - also add info for the all feature. for example: in dashboard there is a card "Total Income". use should know where to add income.

# UI/UX:
No UI choice right now. Use tailwind css for UI. Make sure mobile responsiveness.

# Database Schema:
AI can decide the schema. But it should be normalized and efficient.

# AI Prompt:
you are an expert full stack senior software engineer. I want you to create a web application that can help users track their expenses and income. so create a project structure and start creating the application.

# AI Guidelines:
Read and Update MEMORY.MD file after every change.
