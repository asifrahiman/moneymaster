package com.moneymaster.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.moneymaster.pojo.Expense;
import com.moneymaster.repository.ExpenseRepository;

@Controller
@RequestMapping(path = "/moneymaster/expenses")
public class ExpenseController {
	@Autowired 
	private ExpenseRepository expenseRepository;

	@GetMapping(path = "/add")
	public @ResponseBody String addNewUser(@RequestParam String user, @RequestParam String type) {

		Expense n = new Expense();
		n.setUser(user);
		n.setType(type);
		expenseRepository.save(n);
		return "Saved";
	}

	@GetMapping(path = "/all")
	public @ResponseBody Iterable<Expense> getAllExpenses() {
		// This returns a JSON or XML with the users
		return expenseRepository.findAll();
	}
}
