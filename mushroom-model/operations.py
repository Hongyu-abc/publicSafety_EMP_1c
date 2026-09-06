"""Scalar operations adapted from Module04_BackProp/auto_grad/operations.py."""


class Operation:
    def __call__(self, a, b):
        self.a, self.b = a, b
        return self.forward(a.data, b.data)

    def backprop(self, grad):
        self.a.backprop(self.partial_a() * grad)
        self.b.backprop(self.partial_b() * grad)


class Add(Operation):
    def forward(self, a, b):
        return a + b

    def partial_a(self):
        return 1

    def partial_b(self):
        return 1


class Subtract(Operation):
    def forward(self, a, b):
        return a - b

    def partial_a(self):
        return 1

    def partial_b(self):
        return -1


class Multiply(Operation):
    def forward(self, a, b):
        return a * b

    def partial_a(self):
        return self.b.data

    def partial_b(self):
        return self.a.data


class Divide(Operation):
    def forward(self, a, b):
        return a / b

    def partial_a(self):
        return 1 / self.b.data

    def partial_b(self):
        return -self.a.data / self.b.data ** 2
