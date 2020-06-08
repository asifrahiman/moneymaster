package com.moneymaster.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.moneymaster.pojo.Expense;

// This will be AUTO IMPLEMENTED by Spring into a Bean called userRepository
// CRUD refers Create, Read, Update, Delete

public interface ExpenseRepository extends CrudRepository<Expense, Integer> {

	@Query("SELECT e FROM Expense e WHERE e.user = ?1 and e.date>= ?2")
	Iterable<Expense> findUserExpenses(String user, String startDate);
	
	@Query("SELECT e FROM Expense e WHERE e.user = ?1 and e.date>= ?2 and e.date<=?3")
	Iterable<Expense> findUserExpenses(String user, String startDate, String endDate);
	
	@Query("SELECT SUM(amount) from Expense WHERE type=?1 and user=?2 and date like ?3%")
	Double findUserTrend(String type, String user, String date);
	
	@Query("SELECT SUM(amount) from Expense WHERE type=?1 and user=?2 and date >= ?3")
	Double findUserTrend1(String type, String user, String date);
	
	@Query("SELECT SUM(amount) from Expense WHERE type=?1 and user=?2 and date>= ?3 and date<=?4")
	Double findUserTrend(String type, String user, String date, String endDate);
}
