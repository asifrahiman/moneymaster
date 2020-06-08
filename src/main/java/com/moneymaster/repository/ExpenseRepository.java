package com.moneymaster.repository;

import org.springframework.data.repository.CrudRepository;

import com.moneymaster.pojo.Expense;

// This will be AUTO IMPLEMENTED by Spring into a Bean called userRepository
// CRUD refers Create, Read, Update, Delete

public interface ExpenseRepository extends CrudRepository<Expense, Integer> {

}
